package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Config describes how to construct a Store implementation.
type Config struct {
	Driver                  string
	DSN                     string
	MaxOpenConns            int
	MaxIdleConns            int
	ConnMaxLifetime         time.Duration
	ConnMaxIdleTime         time.Duration
	AllowSuperAdminCounting bool
}

// New creates a Store implementation based on the provided configuration.
func New(ctx context.Context, cfg Config) (Store, func(context.Context) error, error) {
	driver := strings.ToLower(strings.TrimSpace(cfg.Driver))
	if driver == "" || driver == "memory" {
		ms := newMemoryStore(cfg.AllowSuperAdminCounting)
		return ms, func(context.Context) error { return nil }, nil
	}

	switch driver {
	case "postgres", "postgresql", "pgx":
		if strings.TrimSpace(cfg.DSN) == "" {
			return nil, nil, errors.New("store dsn is required for postgres driver")
		}

		db, err := sql.Open("pgx", cfg.DSN)
		if err != nil {
			return nil, nil, err
		}

		if cfg.MaxOpenConns > 0 {
			db.SetMaxOpenConns(cfg.MaxOpenConns)
		}
		if cfg.MaxIdleConns > 0 {
			db.SetMaxIdleConns(cfg.MaxIdleConns)
		}
		if cfg.ConnMaxLifetime > 0 {
			db.SetConnMaxLifetime(cfg.ConnMaxLifetime)
		}
		if cfg.ConnMaxIdleTime > 0 {
			db.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)
		}

		if err := db.PingContext(ctx); err != nil {
			db.Close()
			return nil, nil, err
		}

		cleanup := func(context.Context) error {
			return db.Close()
		}

		return &postgresStore{db: db, allowSuperAdminCounting: cfg.AllowSuperAdminCounting}, cleanup, nil
	default:
		return nil, nil, fmt.Errorf("unsupported store driver %q", cfg.Driver)
	}
}

type schemaCapabilities struct {
	hasMFATOTPSecret     bool
	hasMFAEnabled        bool
	hasMFASecretIssuedAt bool
	hasMFAConfirmedAt    bool
	hasCreatedAt         bool
	hasUpdatedAt         bool
	hasLevel             bool
	hasRole              bool
	hasGroups            bool
	hasPermissions       bool
}

func (c schemaCapabilities) supportsMFA() bool {
	return c.hasMFATOTPSecret && c.hasMFAEnabled && c.hasMFASecretIssuedAt && c.hasMFAConfirmedAt
}

type postgresStore struct {
	db                      *sql.DB
	allowSuperAdminCounting bool

	capsMu     sync.RWMutex
	caps       schemaCapabilities
	capsLoaded bool
}

func (s *postgresStore) CreateUser(ctx context.Context, user *User) error {
	normalizedEmail := strings.ToLower(strings.TrimSpace(user.Email))
	normalizedName := strings.TrimSpace(user.Name)
	if normalizedName == "" {
		return ErrInvalidName
	}

	caps, err := s.capabilities(ctx)
	if err != nil {
		return err
	}

	normalizeUserRoleFields(user)

	var (
		verifiedAt any
	)
	if user.EmailVerified {
		verifiedAt = time.Now().UTC()
	}

	if normalizedEmail != "" {
		const emailExistsQuery = "SELECT EXISTS(SELECT 1 FROM users WHERE lower(email) = $1)"
		emailExists, err := s.userExists(ctx, emailExistsQuery, normalizedEmail)
		if err != nil {
			return err
		}
		if emailExists {
			return ErrEmailExists
		}
	}

	const nameExistsQuery = "SELECT EXISTS(SELECT 1 FROM users WHERE lower(username) = lower($1))"
	nameExists, err := s.userExists(ctx, nameExistsQuery, normalizedName)
	if err != nil {
		return err
	}
	if nameExists {
		return ErrNameExists
	}

	columns := []string{"username", "password", "email", "email_verified_at"}
	placeholders := []string{"$1", "$2", "$3", "$4"}
	args := []any{normalizedName, user.PasswordHash, normalizedEmail, verifiedAt}

	idx := len(args) + 1

	if caps.hasLevel {
		columns = append(columns, "level")
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		args = append(args, user.Level)
		idx++
	}
	if caps.hasRole {
		columns = append(columns, "role")
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		args = append(args, user.Role)
		idx++
	}
	if caps.hasGroups {
		encoded, err := encodeStringSlice(user.Groups)
		if err != nil {
			return err
		}
		columns = append(columns, "groups")
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		args = append(args, encoded)
		idx++
	}
	if caps.hasPermissions {
		encoded, err := encodeStringSlice(user.Permissions)
		if err != nil {
			return err
		}
		columns = append(columns, "permissions")
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		args = append(args, encoded)
		idx++
	}

	query := fmt.Sprintf(`INSERT INTO users (%s)
      VALUES (%s)
      RETURNING uuid, coalesce(created_at, now()), coalesce(updated_at, now()), email_verified`, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	var idValue any
	var createdAt time.Time
	var updatedAt time.Time
	var emailVerified sql.NullBool
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&idValue, &createdAt, &updatedAt, &emailVerified)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrUserNotFound
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" { // unique_violation
				switch {
				case strings.Contains(pgErr.ConstraintName, "email"):
					return ErrEmailExists
				case strings.Contains(pgErr.ConstraintName, "name") || strings.Contains(pgErr.ConstraintName, "username"):
					return ErrNameExists
				}
			}
		}
		return err
	}

	identifier, err := formatIdentifier(idValue)
	if err != nil {
		return err
	}

	user.ID = identifier
	user.Name = normalizedName
	user.Email = normalizedEmail
	user.CreatedAt = createdAt.UTC()
	user.UpdatedAt = updatedAt.UTC()
	user.EmailVerified = emailVerified.Bool
	return nil
}

func (s *postgresStore) userExists(ctx context.Context, query string, arg any) (bool, error) {
	var exists bool
	err := s.db.QueryRowContext(ctx, query, arg).Scan(&exists)
	if err != nil {
		if isDatabaseEmptyError(err) {
			return false, nil
		}
		return false, err
	}
	return exists, nil
}

func isDatabaseEmptyError(err error) bool {
	if errors.Is(err, sql.ErrNoRows) {
		return true
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if pgErr.Code == "42P01" { // undefined_table
			return true
		}
	}
	return false
}

func (s *postgresStore) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	normalized := strings.ToLower(strings.TrimSpace(email))
	if normalized == "" {
		return nil, ErrUserNotFound
	}

	caps, err := s.capabilities(ctx)
	if err != nil {
		return nil, err
	}

	query := s.selectUserQuery(caps, "WHERE lower(email) = $1 LIMIT 1")

	row := s.db.QueryRowContext(ctx, query, normalized)
	return scanUser(row)
}

func (s *postgresStore) GetUserByName(ctx context.Context, name string) (*User, error) {
	normalized := strings.TrimSpace(name)
	if normalized == "" {
		return nil, ErrUserNotFound
	}

	caps, err := s.capabilities(ctx)
	if err != nil {
		return nil, err
	}

	query := s.selectUserQuery(caps, "WHERE lower(username) = lower($1) LIMIT 1")

	row := s.db.QueryRowContext(ctx, query, normalized)
	return scanUser(row)
}

func (s *postgresStore) GetUserByID(ctx context.Context, id string) (*User, error) {
	caps, err := s.capabilities(ctx)
	if err != nil {
		return nil, err
	}

	query := s.selectUserQuery(caps, "WHERE uuid = $1")

	row := s.db.QueryRowContext(ctx, query, id)
	return scanUser(row)
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanUser(row rowScanner) (*User, error) {
	var (
		idValue         any
		username        sql.NullString
		email           sql.NullString
		emailVerified   sql.NullBool
		password        sql.NullString
		mfaSecret       sql.NullString
		mfaEnabled      sql.NullBool
		mfaSecretIssued sql.NullTime
		mfaConfirmed    sql.NullTime
		createdAt       time.Time
		updatedAt       time.Time
		levelValue      sql.NullInt64
		roleValue       sql.NullString
		groupsRaw       []byte
		permissionsRaw  []byte
	)

	if err := row.Scan(&idValue, &username, &email, &emailVerified, &password, &mfaSecret, &mfaEnabled, &mfaSecretIssued, &mfaConfirmed, &createdAt, &updatedAt, &levelValue, &roleValue, &groupsRaw, &permissionsRaw); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	identifier, err := formatIdentifier(idValue)
	if err != nil {
		return nil, err
	}

	user := &User{
		ID:                identifier,
		Name:              strings.TrimSpace(username.String),
		Email:             strings.ToLower(strings.TrimSpace(email.String)),
		EmailVerified:     emailVerified.Bool,
		PasswordHash:      password.String,
		MFATOTPSecret:     strings.TrimSpace(mfaSecret.String),
		MFAEnabled:        mfaEnabled.Bool,
		MFASecretIssuedAt: toUTCTime(mfaSecretIssued),
		MFAConfirmedAt:    toUTCTime(mfaConfirmed),
		CreatedAt:         createdAt.UTC(),
		UpdatedAt:         updatedAt.UTC(),
	}
	if levelValue.Valid {
		user.Level = int(levelValue.Int64)
	}
	user.Role = strings.TrimSpace(roleValue.String)
	user.Groups = decodeStringSlice(groupsRaw)
	user.Permissions = decodeStringSlice(permissionsRaw)
	normalizeUserRoleFields(user)
	return user, nil
}

func (s *postgresStore) UpdateUser(ctx context.Context, user *User) error {
	normalizedName := strings.TrimSpace(user.Name)
	if normalizedName == "" {
		return ErrInvalidName
	}

	normalizedEmail := strings.ToLower(strings.TrimSpace(user.Email))

	caps, err := s.capabilities(ctx)
	if err != nil {
		return err
	}

	var issuedAt any
	if !user.MFASecretIssuedAt.IsZero() {
		issuedAt = user.MFASecretIssuedAt.UTC()
	}
	var confirmedAt any
	if !user.MFAConfirmedAt.IsZero() {
		confirmedAt = user.MFAConfirmedAt.UTC()
	}

	builder := strings.Builder{}
	builder.WriteString("UPDATE users SET username = $1, email = $2, password = $3")

	if user.EmailVerified {
		builder.WriteString(", email_verified_at = COALESCE(email_verified_at, now())")
	} else {
		builder.WriteString(", email_verified_at = NULL")
	}

	normalizeUserRoleFields(user)

	args := []any{normalizedName, normalizedEmail, user.PasswordHash}
	idx := 4

	if caps.hasMFATOTPSecret {
		builder.WriteString(fmt.Sprintf(", mfa_totp_secret = $%d", idx))
		args = append(args, nullForEmpty(user.MFATOTPSecret))
		idx++
	} else if strings.TrimSpace(user.MFATOTPSecret) != "" {
		return ErrMFANotSupported
	}

	if caps.hasMFAEnabled {
		builder.WriteString(fmt.Sprintf(", mfa_enabled = $%d", idx))
		args = append(args, user.MFAEnabled)
		idx++
	} else if user.MFAEnabled {
		return ErrMFANotSupported
	}

	if caps.hasMFASecretIssuedAt {
		builder.WriteString(fmt.Sprintf(", mfa_secret_issued_at = $%d", idx))
		args = append(args, issuedAt)
		idx++
	} else if !user.MFASecretIssuedAt.IsZero() {
		return ErrMFANotSupported
	}

	if caps.hasMFAConfirmedAt {
		builder.WriteString(fmt.Sprintf(", mfa_confirmed_at = $%d", idx))
		args = append(args, confirmedAt)
		idx++
	} else if !user.MFAConfirmedAt.IsZero() {
		return ErrMFANotSupported
	}

	if caps.hasUpdatedAt {
		builder.WriteString(", updated_at = now()")
	}

	if caps.hasLevel {
		builder.WriteString(fmt.Sprintf(", level = $%d", idx))
		args = append(args, user.Level)
		idx++
	}

	if caps.hasRole {
		builder.WriteString(fmt.Sprintf(", role = $%d", idx))
		args = append(args, user.Role)
		idx++
	}

	if caps.hasGroups {
		encoded, err := encodeStringSlice(user.Groups)
		if err != nil {
			return err
		}
		builder.WriteString(fmt.Sprintf(", groups = $%d", idx))
		args = append(args, encoded)
		idx++
	}

	if caps.hasPermissions {
		encoded, err := encodeStringSlice(user.Permissions)
		if err != nil {
			return err
		}
		builder.WriteString(fmt.Sprintf(", permissions = $%d", idx))
		args = append(args, encoded)
		idx++
	}

	builder.WriteString(fmt.Sprintf(" WHERE uuid = $%d RETURNING ", idx))
	args = append(args, user.ID)
	idx++

	if caps.hasCreatedAt {
		builder.WriteString("coalesce(created_at, now())")
	} else {
		builder.WriteString("now()")
	}

	if caps.hasUpdatedAt {
		builder.WriteString(", coalesce(updated_at, now())")
	} else {
		builder.WriteString(", now()")
	}

	query := builder.String()

	var createdAt time.Time
	var updatedAt time.Time
	err = s.db.QueryRowContext(ctx, query, args...).Scan(&createdAt, &updatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrUserNotFound
		}
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				switch {
				case strings.Contains(pgErr.ConstraintName, "email"):
					return ErrEmailExists
				case strings.Contains(pgErr.ConstraintName, "name") || strings.Contains(pgErr.ConstraintName, "username"):
					return ErrNameExists
				}
			}
		}
		return err
	}

	user.Name = normalizedName
	user.Email = normalizedEmail
	user.CreatedAt = createdAt.UTC()
	user.UpdatedAt = updatedAt.UTC()
	return nil
}

func (s *postgresStore) CountSuperAdmins(ctx context.Context) (int, error) {
	if !s.allowSuperAdminCounting {
		return 0, ErrSuperAdminCountingDisabled
	}
	caps, err := s.capabilities(ctx)
	if err != nil {
		return 0, err
	}

	roleClauses := make([]string, 0, 2)
	if caps.hasRole {
		roleClauses = append(roleClauses, "lower(role) = 'admin'")
	}
	if caps.hasLevel {
		roleClauses = append(roleClauses, fmt.Sprintf("level = %d", LevelAdmin))
	}
	if len(roleClauses) == 0 {
		return 0, errors.New("postgres store schema does not expose role or level columns")
	}

	conditions := []string{fmt.Sprintf("(%s)", strings.Join(roleClauses, " OR "))}

	if caps.hasGroups {
		conditions = append(conditions, "groups @> '[\"Admin\"]'::jsonb")
	}
	if caps.hasPermissions {
		conditions = append(conditions, "permissions @> '[\"*\"]'::jsonb")
	}

	query := fmt.Sprintf("SELECT COUNT(*) FROM users WHERE %s", strings.Join(conditions, " AND "))

	var count int
	if err := s.db.QueryRowContext(ctx, query).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

// UpsertSubscription creates or updates a subscription row.
func (s *postgresStore) UpsertSubscription(ctx context.Context, subscription *Subscription) error {
	if subscription == nil {
		return errors.New("subscription is required")
	}

	normalizedUserID := strings.TrimSpace(subscription.UserID)
	if normalizedUserID == "" {
		return ErrUserNotFound
	}

	externalID := strings.TrimSpace(subscription.ExternalID)
	if externalID == "" {
		return errors.New("external id is required")
	}

	encodedMeta, err := json.Marshal(subscription.Meta)
	if err != nil {
		return err
	}

	var cancelledAt any
	if subscription.CancelledAt != nil {
		cancelledAt = subscription.CancelledAt.UTC()
	}

	const query = `INSERT INTO subscriptions (user_uuid, provider, kind, plan_id, external_id, status, meta, cancelled_at)
VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, '{}'::jsonb), $8)
ON CONFLICT (user_uuid, external_id) DO UPDATE SET
  provider = EXCLUDED.provider,
  kind = EXCLUDED.kind,
  plan_id = EXCLUDED.plan_id,
  status = EXCLUDED.status,
  meta = EXCLUDED.meta,
  cancelled_at = EXCLUDED.cancelled_at,
  updated_at = now()
RETURNING uuid, created_at, updated_at, cancelled_at`

	var (
		idValue   any
		createdAt time.Time
		updatedAt time.Time
		cancelled sql.NullTime
	)

	err = s.db.QueryRowContext(
		ctx,
		query,
		normalizedUserID,
		strings.TrimSpace(subscription.Provider),
		strings.TrimSpace(subscription.Kind),
		strings.TrimSpace(subscription.PlanID),
		externalID,
		strings.TrimSpace(subscription.Status),
		encodedMeta,
		cancelledAt,
	).Scan(&idValue, &createdAt, &updatedAt, &cancelled)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrSubscriptionNotFound
		}
		return err
	}

	identifier, err := formatIdentifier(idValue)
	if err != nil {
		return err
	}

	subscription.ID = identifier
	subscription.UserID = normalizedUserID
	subscription.ExternalID = externalID
	subscription.CreatedAt = createdAt.UTC()
	subscription.UpdatedAt = updatedAt.UTC()
	subscription.Meta, _ = decodeSubscriptionMeta(encodedMeta)
	if cancelled.Valid {
		subscription.CancelledAt = &cancelled.Time
	}

	return nil
}

// ListSubscriptionsByUser returns all subscriptions for a user ordered by recency.
func (s *postgresStore) ListSubscriptionsByUser(ctx context.Context, userID string) ([]Subscription, error) {
	normalizedUserID := strings.TrimSpace(userID)
	if normalizedUserID == "" {
		return nil, ErrUserNotFound
	}

	const query = `SELECT uuid, user_uuid, provider, kind, plan_id, external_id, status, meta, created_at, updated_at, cancelled_at
FROM subscriptions WHERE user_uuid = $1 ORDER BY created_at DESC`

	rows, err := s.db.QueryContext(ctx, query, normalizedUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subs []Subscription
	for rows.Next() {
		var (
			idValue    any
			provider   string
			kind       string
			planID     sql.NullString
			externalID string
			status     string
			metaBytes  []byte
			createdAt  time.Time
			updatedAt  time.Time
			cancelled  sql.NullTime
		)
		if err := rows.Scan(&idValue, &normalizedUserID, &provider, &kind, &planID, &externalID, &status, &metaBytes, &createdAt, &updatedAt, &cancelled); err != nil {
			return nil, err
		}

		identifier, err := formatIdentifier(idValue)
		if err != nil {
			return nil, err
		}

		meta, err := decodeSubscriptionMeta(metaBytes)
		if err != nil {
			return nil, err
		}

		sub := Subscription{
			ID:         identifier,
			UserID:     userID,
			Provider:   provider,
			Kind:       kind,
			PlanID:     planID.String,
			ExternalID: externalID,
			Status:     status,
			Meta:       meta,
			CreatedAt:  createdAt.UTC(),
			UpdatedAt:  updatedAt.UTC(),
		}
		if cancelled.Valid {
			sub.CancelledAt = &cancelled.Time
		}

		subs = append(subs, sub)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return subs, nil
}

// CancelSubscription marks the subscription as cancelled.
func (s *postgresStore) CancelSubscription(ctx context.Context, userID, externalID string, cancelledAt time.Time) (*Subscription, error) {
	normalizedUserID := strings.TrimSpace(userID)
	if normalizedUserID == "" {
		return nil, ErrUserNotFound
	}

	key := strings.TrimSpace(externalID)
	if key == "" {
		return nil, ErrSubscriptionNotFound
	}

	const query = `UPDATE subscriptions
SET status = 'cancelled', cancelled_at = $3, updated_at = now()
WHERE user_uuid = $1 AND external_id = $2
RETURNING uuid, provider, kind, plan_id, status, meta, created_at, updated_at, cancelled_at`

	var (
		idValue   any
		provider  string
		kind      string
		planID    sql.NullString
		status    string
		metaBytes []byte
		createdAt time.Time
		updatedAt time.Time
		cancelled sql.NullTime
	)

	err := s.db.QueryRowContext(ctx, query, normalizedUserID, key, cancelledAt.UTC()).Scan(
		&idValue,
		&provider,
		&kind,
		&planID,
		&status,
		&metaBytes,
		&createdAt,
		&updatedAt,
		&cancelled,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSubscriptionNotFound
		}
		return nil, err
	}

	identifier, err := formatIdentifier(idValue)
	if err != nil {
		return nil, err
	}

	meta, err := decodeSubscriptionMeta(metaBytes)
	if err != nil {
		return nil, err
	}

	sub := &Subscription{
		ID:         identifier,
		UserID:     normalizedUserID,
		Provider:   provider,
		Kind:       kind,
		PlanID:     planID.String,
		ExternalID: key,
		Status:     status,
		Meta:       meta,
		CreatedAt:  createdAt.UTC(),
		UpdatedAt:  updatedAt.UTC(),
	}
	if cancelled.Valid {
		sub.CancelledAt = &cancelled.Time
	}

	return sub, nil
}

func decodeSubscriptionMeta(raw []byte) (map[string]any, error) {
	if len(raw) == 0 {
		return map[string]any{}, nil
	}
	var meta map[string]any
	if err := json.Unmarshal(raw, &meta); err != nil {
		return nil, err
	}
	if meta == nil {
		meta = map[string]any{}
	}
	return meta, nil
}

func nullForEmpty(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func toUTCTime(value sql.NullTime) time.Time {
	if !value.Valid {
		return time.Time{}
	}
	return value.Time.UTC()
}

func formatIdentifier(value any) (string, error) {
	switch v := value.(type) {
	case nil:
		return "", errors.New("user id is nil")
	case string:
		return v, nil
	case []byte:
		return string(v), nil
	case [16]byte:
		id := uuid.UUID(v)
		return id.String(), nil
	case *[16]byte:
		if v == nil {
			return "", errors.New("user id is nil")
		}
		id := uuid.UUID(*v)
		return id.String(), nil
	case int64:
		return strconv.FormatInt(v, 10), nil
	case int32:
		return strconv.FormatInt(int64(v), 10), nil
	case int:
		return strconv.FormatInt(int64(v), 10), nil
	case uint64:
		return strconv.FormatUint(v, 10), nil
	case uint32:
		return strconv.FormatUint(uint64(v), 10), nil
	case pgtype.UUID:
		if !v.Valid {
			return "", errors.New("user id is nil")
		}
		return v.String(), nil
	case *pgtype.UUID:
		if v == nil || !v.Valid {
			return "", errors.New("user id is nil")
		}
		return v.String(), nil
	case fmt.Stringer:
		return v.String(), nil
	default:
		return "", fmt.Errorf("unsupported identifier type %T", value)
	}
}

func (s *postgresStore) capabilities(ctx context.Context) (schemaCapabilities, error) {
	s.capsMu.RLock()
	if s.capsLoaded {
		caps := s.caps
		s.capsMu.RUnlock()
		return caps, nil
	}
	s.capsMu.RUnlock()

	s.capsMu.Lock()
	defer s.capsMu.Unlock()
	if s.capsLoaded {
		return s.caps, nil
	}

	query := `SELECT
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'mfa_totp_secret'
  ) AS has_mfa_totp_secret,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'mfa_enabled'
  ) AS has_mfa_enabled,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'mfa_secret_issued_at'
  ) AS has_mfa_secret_issued_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'mfa_confirmed_at'
  ) AS has_mfa_confirmed_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'created_at'
  ) AS has_created_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'updated_at'
  ) AS has_updated_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'level'
  ) AS has_level,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'role'
  ) AS has_role,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'groups'
  ) AS has_groups,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
      AND table_schema = ANY (current_schemas(false))
      AND column_name = 'permissions'
  ) AS has_permissions`

	row := s.db.QueryRowContext(ctx, query)
	var caps schemaCapabilities
	if err := row.Scan(
		&caps.hasMFATOTPSecret,
		&caps.hasMFAEnabled,
		&caps.hasMFASecretIssuedAt,
		&caps.hasMFAConfirmedAt,
		&caps.hasCreatedAt,
		&caps.hasUpdatedAt,
		&caps.hasLevel,
		&caps.hasRole,
		&caps.hasGroups,
		&caps.hasPermissions,
	); err != nil {
		return schemaCapabilities{}, err
	}

	s.caps = caps
	s.capsLoaded = true
	return caps, nil
}

func (s *postgresStore) selectUserQuery(caps schemaCapabilities, whereClause string) string {
	secretExpr := "NULL::text"
	if caps.hasMFATOTPSecret {
		secretExpr = "mfa_totp_secret"
	}

	enabledExpr := "false"
	if caps.hasMFAEnabled {
		enabledExpr = "coalesce(mfa_enabled, false)"
	}

	issuedExpr := "NULL::timestamptz"
	if caps.hasMFASecretIssuedAt {
		issuedExpr = "mfa_secret_issued_at"
	}

	confirmedExpr := "NULL::timestamptz"
	if caps.hasMFAConfirmedAt {
		confirmedExpr = "mfa_confirmed_at"
	}

	createdExpr := "now()"
	if caps.hasCreatedAt {
		createdExpr = "coalesce(created_at, now())"
	}

	updatedExpr := "now()"
	if caps.hasUpdatedAt {
		updatedExpr = "coalesce(updated_at, now())"
	}

	levelExpr := fmt.Sprintf("%d", LevelUser)
	if caps.hasLevel {
		levelExpr = fmt.Sprintf("coalesce(level, %d)", LevelUser)
	}

	roleExpr := fmt.Sprintf("'%s'", RoleUser)
	if caps.hasRole {
		roleExpr = fmt.Sprintf("coalesce(role, '%s')", RoleUser)
	}

	groupsExpr := "'[]'::jsonb"
	if caps.hasGroups {
		groupsExpr = "coalesce(groups, '[]'::jsonb)"
	}

	permissionsExpr := "'[]'::jsonb"
	if caps.hasPermissions {
		permissionsExpr = "coalesce(permissions, '[]'::jsonb)"
	}

	return fmt.Sprintf(`SELECT uuid, username, email, email_verified, password, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s FROM users %s`,
		secretExpr, enabledExpr, issuedExpr, confirmedExpr, createdExpr, updatedExpr, levelExpr, roleExpr, groupsExpr, permissionsExpr, whereClause)
}

func encodeStringSlice(values []string) ([]byte, error) {
	normalized := normalizeStringSlice(values)
	if len(normalized) == 0 {
		return []byte("[]"), nil
	}
	return json.Marshal(normalized)
}

func decodeStringSlice(raw []byte) []string {
	if len(raw) == 0 {
		return nil
	}
	var values []string
	if err := json.Unmarshal(raw, &values); err != nil {
		return nil
	}
	return normalizeStringSlice(values)
}
