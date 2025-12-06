package migrate

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"slices"
	"sort"
	"strings"
	"time"

	accountschema "account/sql"
)

// AccountDump represents the serialized snapshot of account-related tables.
type AccountDump struct {
	Metadata   *SnapshotMetadata `yaml:"metadata,omitempty"`
	Users      []UserRecord      `yaml:"users"`
	Identities []IdentityRecord  `yaml:"identities,omitempty"`
	Sessions   []SessionRecord   `yaml:"sessions,omitempty"`
}

// UserRecord captures the exported representation of a user row.
type UserRecord struct {
	UUID              string     `yaml:"uuid"`
	Username          string     `yaml:"username"`
	PasswordHash      string     `yaml:"password"`
	Email             string     `yaml:"email,omitempty"`
	EmailVerified     bool       `yaml:"emailVerified"`
	EmailVerifiedAt   *time.Time `yaml:"emailVerifiedAt,omitempty"`
	Level             int        `yaml:"level"`
	Role              string     `yaml:"role"`
	Groups            []string   `yaml:"groups,omitempty"`
	Permissions       []string   `yaml:"permissions,omitempty"`
	CreatedAt         time.Time  `yaml:"createdAt"`
	UpdatedAt         time.Time  `yaml:"updatedAt"`
	MFATOTPSecret     string     `yaml:"mfaTotpSecret,omitempty"`
	MFAEnabled        bool       `yaml:"mfaEnabled"`
	MFASecretIssuedAt *time.Time `yaml:"mfaSecretIssuedAt,omitempty"`
	MFAConfirmedAt    *time.Time `yaml:"mfaConfirmedAt,omitempty"`
}

// IdentityRecord captures a federated identity row associated with a user.
type IdentityRecord struct {
	UUID       string     `yaml:"uuid"`
	Provider   string     `yaml:"provider"`
	ExternalID string     `yaml:"externalId"`
	UserUUID   string     `yaml:"userUuid"`
	CreatedAt  *time.Time `yaml:"createdAt,omitempty"`
	UpdatedAt  *time.Time `yaml:"updatedAt,omitempty"`
}

// SessionRecord captures a session row associated with a user.
type SessionRecord struct {
	UUID      string     `yaml:"uuid"`
	Token     string     `yaml:"token"`
	ExpiresAt time.Time  `yaml:"expiresAt"`
	UserUUID  string     `yaml:"userUuid"`
	CreatedAt *time.Time `yaml:"createdAt,omitempty"`
	UpdatedAt *time.Time `yaml:"updatedAt,omitempty"`
}

// MergeStrategy defines how snapshot data should be reconciled with the target database.
type MergeStrategy string

const (
	// MergeStrategyReplace preserves the legacy behaviour where incoming records
	// fully replace existing ones.
	MergeStrategyReplace MergeStrategy = "replace"
	// MergeStrategyAppend performs additive merges, keeping existing data that is
	// absent from the snapshot.
	MergeStrategyAppend MergeStrategy = "append"
	// MergeStrategyTimestamp resolves conflicts by preferring rows with the newest
	// updated_at timestamp.
	MergeStrategyTimestamp MergeStrategy = "timestamp"
)

// ImportOptions configures how snapshot imports should be applied.
type ImportOptions struct {
	Merge         bool
	MergeStrategy MergeStrategy
	DryRun        bool
	Allowlist     map[string]struct{}
	LogWriter     io.Writer
}

// ImportReport captures the outcome of an import (or dry-run) execution.
type ImportReport struct {
	UsersInserted int
	UsersUpdated  int
	UsersSkipped  int

	IdentitiesInserted int
	IdentitiesUpdated  int
	IdentitiesDeleted  int

	SessionsInserted int
	SessionsUpdated  int
	SessionsDeleted  int

	ConflictsResolved int
	ConflictsSkipped  int
}

// Exporter reads account data from a PostgreSQL database.
type Exporter struct{}

// NewExporter constructs an Exporter instance.
func NewExporter() *Exporter {
	return &Exporter{}
}

// Export fetches user-related data filtered by the provided email keyword. When
// emailKeyword is empty all users are included.
func (e *Exporter) Export(ctx context.Context, dsn, emailKeyword string) (*AccountDump, error) {
	db, err := openDB(ctx, dsn)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	dump := &AccountDump{
		Metadata: &SnapshotMetadata{
			Version:    SnapshotVersion,
			SchemaHash: accountschema.Hash(),
			ExportedAt: time.Now().UTC(),
		},
	}

	users, err := loadUsers(ctx, db, emailKeyword)
	if err != nil {
		return nil, err
	}
	dump.Users = users

	if len(users) == 0 {
		return dump, nil
	}

	uuids := make([]string, len(users))
	for i, user := range users {
		uuids[i] = user.UUID
	}

	identities, err := loadIdentities(ctx, db, uuids)
	if err != nil {
		return nil, err
	}
	dump.Identities = identities

	sessions, err := loadSessions(ctx, db, uuids)
	if err != nil {
		return nil, err
	}
	dump.Sessions = sessions

	return dump, nil
}

// Importer writes account data into a PostgreSQL database.
type Importer struct{}

// NewImporter constructs an Importer instance.
func NewImporter() *Importer {
	return &Importer{}
}

// Import restores account data from a dump into the target database using the
// provided options. When merge mode is disabled the behaviour mirrors the
// legacy implementation.
func (i *Importer) Import(ctx context.Context, dsn string, dump *AccountDump, opts ImportOptions) (*ImportReport, error) {
	if dump == nil {
		return nil, errors.New("dump is nil")
	}
	if err := validateSnapshotMetadata(dump.Metadata); err != nil {
		return nil, err
	}

	logWriter := opts.LogWriter
	if logWriter == nil {
		logWriter = io.Discard
	}
	logf := func(format string, args ...any) {
		fmt.Fprintf(logWriter, format, args...)
	}

	strategy := opts.MergeStrategy
	if strategy == "" {
		if opts.Merge {
			strategy = MergeStrategyAppend
		} else {
			strategy = MergeStrategyReplace
		}
	}
	switch strategy {
	case MergeStrategyReplace, MergeStrategyAppend, MergeStrategyTimestamp:
	default:
		return nil, fmt.Errorf("unsupported merge strategy %q", strategy)
	}
	if !opts.Merge {
		strategy = MergeStrategyReplace
	}
	db, err := openDB(ctx, dsn)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	identityCaps, err := tableColumnCaps(ctx, db, "identities")
	if err != nil {
		return nil, err
	}
	sessionCaps, err := tableColumnCaps(ctx, db, "sessions")
	if err != nil {
		return nil, err
	}

	userUUIDs := make([]string, 0, len(dump.Users))
	for _, user := range dump.Users {
		userUUIDs = append(userUUIDs, user.UUID)
	}

	existingUsers, err := loadUsersByUUIDs(ctx, db, userUUIDs)
	if err != nil {
		return nil, err
	}

	existingIdentitiesSlice, err := loadIdentities(ctx, db, userUUIDs)
	if err != nil {
		return nil, err
	}
	existingSessionsSlice, err := loadSessions(ctx, db, userUUIDs)
	if err != nil {
		return nil, err
	}

	existingIdentitiesByUUID := make(map[string]IdentityRecord, len(existingIdentitiesSlice))
	existingIdentitiesByUser := make(map[string][]IdentityRecord)
	for _, identity := range existingIdentitiesSlice {
		existingIdentitiesByUUID[identity.UUID] = identity
		existingIdentitiesByUser[identity.UserUUID] = append(existingIdentitiesByUser[identity.UserUUID], identity)
	}

	existingSessionsByUUID := make(map[string]SessionRecord, len(existingSessionsSlice))
	existingSessionsByUser := make(map[string][]SessionRecord)
	for _, session := range existingSessionsSlice {
		existingSessionsByUUID[session.UUID] = session
		existingSessionsByUser[session.UserUUID] = append(existingSessionsByUser[session.UserUUID], session)
	}

	incomingIdentitiesByUser := make(map[string][]IdentityRecord)
	for _, identity := range dump.Identities {
		incomingIdentitiesByUser[identity.UserUUID] = append(incomingIdentitiesByUser[identity.UserUUID], identity)
	}

	incomingSessionsByUser := make(map[string][]SessionRecord)
	for _, session := range dump.Sessions {
		incomingSessionsByUser[session.UserUUID] = append(incomingSessionsByUser[session.UserUUID], session)
	}

	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, err
	}
	committed := false
	defer func() {
		if !committed {
			tx.Rollback()
		}
	}()

	report := &ImportReport{}

	allowlist := opts.Allowlist
	allowlistEnabled := opts.Merge && len(allowlist) > 0

	for _, user := range dump.Users {
		if allowlistEnabled {
			if _, ok := allowlist[user.UUID]; !ok {
				report.UsersSkipped++
				logf("skip user %s: not present in merge allowlist\n", user.UUID)
				continue
			}
		}

		existing, hasExisting := existingUsers[user.UUID]

		if opts.Merge && hasExisting && strategy == MergeStrategyTimestamp && existing.UpdatedAt.After(user.UpdatedAt) {
			report.UsersSkipped++
			report.ConflictsSkipped++
			logf("skip user %s: existing updated_at %s newer than snapshot %s\n", user.UUID, existing.UpdatedAt.Format(time.RFC3339), user.UpdatedAt.Format(time.RFC3339))
			continue
		}

		mergedUser, changed := mergeUserRecord(user, existing, opts.Merge, hasExisting)

		if !hasExisting {
			report.UsersInserted++
		} else if changed {
			report.UsersUpdated++
			if opts.Merge && strategy == MergeStrategyTimestamp {
				report.ConflictsResolved++
			}
		} else {
			report.UsersSkipped++
		}

		if changed && !opts.DryRun {
			if err := upsertUser(ctx, tx, &mergedUser); err != nil {
				return nil, err
			}
		}

		existingUsers[user.UUID] = mergedUser

		incomingIdentities := incomingIdentitiesByUser[user.UUID]
		incomingSessions := incomingSessionsByUser[user.UUID]

		if !opts.Merge || strategy == MergeStrategyReplace {
			if existingCount := len(existingIdentitiesByUser[user.UUID]); existingCount > 0 {
				report.IdentitiesDeleted += existingCount
				if !opts.DryRun {
					if _, err := tx.ExecContext(ctx, `DELETE FROM identities WHERE user_uuid = $1`, user.UUID); err != nil {
						return nil, err
					}
				}
			}
			if existingCount := len(existingSessionsByUser[user.UUID]); existingCount > 0 {
				report.SessionsDeleted += existingCount
				if !opts.DryRun {
					if _, err := tx.ExecContext(ctx, `DELETE FROM sessions WHERE user_uuid = $1`, user.UUID); err != nil {
						return nil, err
					}
				}
			}

			for _, identity := range incomingIdentities {
				if _, ok := existingIdentitiesByUUID[identity.UUID]; ok {
					report.IdentitiesUpdated++
				} else {
					report.IdentitiesInserted++
				}
				if !opts.DryRun {
					if err := upsertIdentity(ctx, tx, &identity, identityCaps); err != nil {
						return nil, err
					}
				}
			}

			for _, session := range incomingSessions {
				if _, ok := existingSessionsByUUID[session.UUID]; ok {
					report.SessionsUpdated++
				} else {
					report.SessionsInserted++
				}
				if !opts.DryRun {
					if err := upsertSession(ctx, tx, &session, sessionCaps); err != nil {
						return nil, err
					}
				}
			}

			continue
		}

		// Merge mode (append/timestamp) for identities.
		for _, identity := range incomingIdentities {
			existingIdentity, ok := existingIdentitiesByUUID[identity.UUID]
			if !ok {
				report.IdentitiesInserted++
				if !opts.DryRun {
					if err := upsertIdentity(ctx, tx, &identity, identityCaps); err != nil {
						return nil, err
					}
				}
				continue
			}

			if strategy == MergeStrategyTimestamp && preferExistingIdentity(existingIdentity, identity) {
				report.ConflictsSkipped++
				logf("retain identity %s for user %s: existing updated_at preferred\n", identity.UUID, identity.UserUUID)
				continue
			}

			if identityDiffers(identity, existingIdentity) {
				report.IdentitiesUpdated++
				if strategy == MergeStrategyTimestamp {
					report.ConflictsResolved++
				}
				if !opts.DryRun {
					if err := upsertIdentity(ctx, tx, &identity, identityCaps); err != nil {
						return nil, err
					}
				}
			}
		}

		for _, session := range incomingSessions {
			existingSession, ok := existingSessionsByUUID[session.UUID]
			if !ok {
				report.SessionsInserted++
				if !opts.DryRun {
					if err := upsertSession(ctx, tx, &session, sessionCaps); err != nil {
						return nil, err
					}
				}
				continue
			}

			if strategy == MergeStrategyTimestamp && preferExistingSession(existingSession, session) {
				report.ConflictsSkipped++
				logf("retain session %s for user %s: existing updated_at preferred\n", session.UUID, session.UserUUID)
				continue
			}

			if sessionDiffers(session, existingSession) {
				report.SessionsUpdated++
				if strategy == MergeStrategyTimestamp {
					report.ConflictsResolved++
				}
				if !opts.DryRun {
					if err := upsertSession(ctx, tx, &session, sessionCaps); err != nil {
						return nil, err
					}
				}
			}
		}
	}

	if opts.DryRun {
		if err := tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
			return nil, err
		}
		committed = true
		logf("dry-run complete: no changes applied\n")
		return report, nil
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	committed = true
	return report, nil
}

const userSelectColumns = `uuid, username, password, email, email_verified, email_verified_at, level, role, groups, permissions, created_at, updated_at, mfa_totp_secret, mfa_enabled, mfa_secret_issued_at, mfa_confirmed_at`

type rowScanner interface {
	Scan(dest ...any) error
}

func loadUsers(ctx context.Context, db *sql.DB, emailKeyword string) ([]UserRecord, error) {
	var (
		query strings.Builder
		args  []any
	)

	query.WriteString("SELECT ")
	query.WriteString(userSelectColumns)
	query.WriteString(" FROM users")
	if keyword := strings.TrimSpace(emailKeyword); keyword != "" {
		query.WriteString(` WHERE email ILIKE $1`)
		args = append(args, "%"+keyword+"%")
	}
	query.WriteString(` ORDER BY created_at ASC`)

	rows, err := db.QueryContext(ctx, query.String(), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []UserRecord
	for rows.Next() {
		user, err := scanUserRow(rows)
		if err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func loadUsersByUUIDs(ctx context.Context, db *sql.DB, uuids []string) (map[string]UserRecord, error) {
	users := make(map[string]UserRecord, len(uuids))
	if len(uuids) == 0 {
		return users, nil
	}

	queryTemplate := fmt.Sprintf("SELECT %s FROM users WHERE uuid IN (%%s)", userSelectColumns)
	query, args := buildInQuery(queryTemplate, uuids)
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		user, err := scanUserRow(rows)
		if err != nil {
			return nil, err
		}
		users[user.UUID] = user
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func scanUserRow(scanner rowScanner) (UserRecord, error) {
	var (
		email           sql.NullString
		emailVerified   bool
		emailVerifiedAt sql.NullTime
		level           sql.NullInt64
		role            sql.NullString
		groupsRaw       []byte
		permissionsRaw  []byte
		createdAt       time.Time
		updatedAt       time.Time
		mfaSecret       sql.NullString
		mfaEnabled      sql.NullBool
		mfaIssuedAt     sql.NullTime
		mfaConfirmedAt  sql.NullTime
		user            UserRecord
	)

	if err := scanner.Scan(
		&user.UUID,
		&user.Username,
		&user.PasswordHash,
		&email,
		&emailVerified,
		&emailVerifiedAt,
		&level,
		&role,
		&groupsRaw,
		&permissionsRaw,
		&createdAt,
		&updatedAt,
		&mfaSecret,
		&mfaEnabled,
		&mfaIssuedAt,
		&mfaConfirmedAt,
	); err != nil {
		return UserRecord{}, err
	}

	if email.Valid {
		user.Email = email.String
	}
	user.EmailVerified = emailVerified
	if emailVerifiedAt.Valid {
		ts := emailVerifiedAt.Time
		user.EmailVerifiedAt = &ts
	}
	if level.Valid {
		user.Level = int(level.Int64)
	}
	if role.Valid {
		user.Role = role.String
	}
	if len(groupsRaw) > 0 {
		if err := json.Unmarshal(groupsRaw, &user.Groups); err != nil {
			return UserRecord{}, fmt.Errorf("decode groups for user %s: %w", user.UUID, err)
		}
	}
	if len(permissionsRaw) > 0 {
		if err := json.Unmarshal(permissionsRaw, &user.Permissions); err != nil {
			return UserRecord{}, fmt.Errorf("decode permissions for user %s: %w", user.UUID, err)
		}
	}
	user.CreatedAt = createdAt
	user.UpdatedAt = updatedAt
	if mfaSecret.Valid {
		user.MFATOTPSecret = mfaSecret.String
	}
	user.MFAEnabled = mfaEnabled.Bool
	if mfaIssuedAt.Valid {
		ts := mfaIssuedAt.Time
		user.MFASecretIssuedAt = &ts
	}
	if mfaConfirmedAt.Valid {
		ts := mfaConfirmedAt.Time
		user.MFAConfirmedAt = &ts
	}

	ensureUserDefaults(&user)

	return user, nil
}

func ensureUserDefaults(user *UserRecord) {
	if user.Groups == nil {
		user.Groups = []string{}
	}
	if user.Permissions == nil {
		user.Permissions = []string{}
	}
	if user.Role == "" {
		user.Role = "user"
	}
}

func mergeUserRecord(incoming UserRecord, existing UserRecord, merge bool, hasExisting bool) (UserRecord, bool) {
	ensureUserDefaults(&incoming)

	if !hasExisting {
		return incoming, true
	}

	if merge {
		if incoming.Email == "" {
			incoming.Email = existing.Email
		}
		if incoming.EmailVerifiedAt == nil {
			incoming.EmailVerifiedAt = cloneTimePtr(existing.EmailVerifiedAt)
		}
		if len(incoming.Groups) == 0 && len(existing.Groups) > 0 {
			incoming.Groups = append([]string(nil), existing.Groups...)
		}
		if len(incoming.Permissions) == 0 && len(existing.Permissions) > 0 {
			incoming.Permissions = append([]string(nil), existing.Permissions...)
		}
		if incoming.Role == "" {
			incoming.Role = existing.Role
		}
		if incoming.MFATOTPSecret == "" {
			incoming.MFATOTPSecret = existing.MFATOTPSecret
		}
		if incoming.MFASecretIssuedAt == nil {
			incoming.MFASecretIssuedAt = cloneTimePtr(existing.MFASecretIssuedAt)
		}
		if incoming.MFAConfirmedAt == nil {
			incoming.MFAConfirmedAt = cloneTimePtr(existing.MFAConfirmedAt)
		}
	}

	changed := userDiffers(incoming, existing)
	return incoming, changed
}

func userDiffers(a, b UserRecord) bool {
	if a.Username != b.Username {
		return true
	}
	if a.PasswordHash != b.PasswordHash {
		return true
	}
	if a.Email != b.Email {
		return true
	}
	if a.EmailVerified != b.EmailVerified {
		return true
	}
	if !timePtrEqual(a.EmailVerifiedAt, b.EmailVerifiedAt) {
		return true
	}
	if a.Level != b.Level {
		return true
	}
	if a.Role != b.Role {
		return true
	}
	if !slices.Equal(a.Groups, b.Groups) {
		return true
	}
	if !slices.Equal(a.Permissions, b.Permissions) {
		return true
	}
	if !a.CreatedAt.Equal(b.CreatedAt) {
		return true
	}
	if !a.UpdatedAt.Equal(b.UpdatedAt) {
		return true
	}
	if a.MFATOTPSecret != b.MFATOTPSecret {
		return true
	}
	if a.MFAEnabled != b.MFAEnabled {
		return true
	}
	if !timePtrEqual(a.MFASecretIssuedAt, b.MFASecretIssuedAt) {
		return true
	}
	if !timePtrEqual(a.MFAConfirmedAt, b.MFAConfirmedAt) {
		return true
	}
	return false
}

func identityDiffers(a, b IdentityRecord) bool {
	if a.Provider != b.Provider {
		return true
	}
	if a.ExternalID != b.ExternalID {
		return true
	}
	if a.UserUUID != b.UserUUID {
		return true
	}
	if !timePtrEqual(a.CreatedAt, b.CreatedAt) {
		return true
	}
	if !timePtrEqual(a.UpdatedAt, b.UpdatedAt) {
		return true
	}
	return false
}

func preferExistingIdentity(existing, incoming IdentityRecord) bool {
	switch {
	case existing.UpdatedAt != nil && incoming.UpdatedAt != nil:
		if existing.UpdatedAt.Equal(*incoming.UpdatedAt) {
			return false
		}
		return existing.UpdatedAt.After(*incoming.UpdatedAt)
	case existing.UpdatedAt != nil:
		return true
	case incoming.UpdatedAt != nil:
		return false
	}

	if existing.CreatedAt != nil && incoming.CreatedAt != nil {
		if existing.CreatedAt.Equal(*incoming.CreatedAt) {
			return false
		}
		return existing.CreatedAt.After(*incoming.CreatedAt)
	}

	return false
}

func sessionDiffers(a, b SessionRecord) bool {
	if a.Token != b.Token {
		return true
	}
	if !a.ExpiresAt.Equal(b.ExpiresAt) {
		return true
	}
	if a.UserUUID != b.UserUUID {
		return true
	}
	if !timePtrEqual(a.CreatedAt, b.CreatedAt) {
		return true
	}
	if !timePtrEqual(a.UpdatedAt, b.UpdatedAt) {
		return true
	}
	return false
}

func preferExistingSession(existing, incoming SessionRecord) bool {
	switch {
	case existing.UpdatedAt != nil && incoming.UpdatedAt != nil:
		if existing.UpdatedAt.Equal(*incoming.UpdatedAt) {
			return false
		}
		return existing.UpdatedAt.After(*incoming.UpdatedAt)
	case existing.UpdatedAt != nil:
		return true
	case incoming.UpdatedAt != nil:
		return false
	}

	if existing.CreatedAt != nil && incoming.CreatedAt != nil {
		if existing.CreatedAt.Equal(*incoming.CreatedAt) {
			return false
		}
		return existing.CreatedAt.After(*incoming.CreatedAt)
	}

	return false
}

func cloneTimePtr(ts *time.Time) *time.Time {
	if ts == nil {
		return nil
	}
	clone := *ts
	return &clone
}

func timePtrEqual(a, b *time.Time) bool {
	switch {
	case a == nil && b == nil:
		return true
	case a == nil || b == nil:
		return false
	default:
		return a.Equal(*b)
	}
}

func loadIdentities(ctx context.Context, db *sql.DB, uuids []string) ([]IdentityRecord, error) {
	if len(uuids) == 0 {
		return nil, nil
	}

	caps, err := tableColumnCaps(ctx, db, "identities")
	if err != nil {
		return nil, err
	}

	columns := []string{"uuid", "provider", "external_id", "user_uuid"}
	if caps.hasCreatedAt {
		columns = append(columns, "created_at")
	}
	if caps.hasUpdatedAt {
		columns = append(columns, "updated_at")
	}

	orderClause := " ORDER BY uuid ASC"
	if caps.hasCreatedAt {
		orderClause = " ORDER BY created_at ASC"
	}

	format := fmt.Sprintf("SELECT %s FROM identities WHERE user_uuid IN (%%s)%s", strings.Join(columns, ", "), orderClause)
	query, args := buildInQuery(format, uuids)
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var identities []IdentityRecord
	for rows.Next() {
		var identity IdentityRecord
		scanArgs := []any{
			&identity.UUID,
			&identity.Provider,
			&identity.ExternalID,
			&identity.UserUUID,
		}

		var createdAt, updatedAt sql.NullTime
		if caps.hasCreatedAt {
			scanArgs = append(scanArgs, &createdAt)
		}
		if caps.hasUpdatedAt {
			scanArgs = append(scanArgs, &updatedAt)
		}

		if err := rows.Scan(scanArgs...); err != nil {
			return nil, err
		}

		if caps.hasCreatedAt && createdAt.Valid {
			ts := createdAt.Time
			identity.CreatedAt = &ts
		}
		if caps.hasUpdatedAt && updatedAt.Valid {
			ts := updatedAt.Time
			identity.UpdatedAt = &ts
		}
		identities = append(identities, identity)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	sort.SliceStable(identities, func(i, j int) bool {
		if identities[i].UserUUID == identities[j].UserUUID {
			switch {
			case identities[i].CreatedAt == nil && identities[j].CreatedAt == nil:
				return identities[i].UUID < identities[j].UUID
			case identities[i].CreatedAt == nil:
				return false
			case identities[j].CreatedAt == nil:
				return true
			default:
				return identities[i].CreatedAt.Before(*identities[j].CreatedAt)
			}
		}
		return identities[i].UserUUID < identities[j].UserUUID
	})

	return identities, nil
}

func loadSessions(ctx context.Context, db *sql.DB, uuids []string) ([]SessionRecord, error) {
	if len(uuids) == 0 {
		return nil, nil
	}

	caps, err := tableColumnCaps(ctx, db, "sessions")
	if err != nil {
		return nil, err
	}

	columns := []string{"uuid", "token", "expires_at", "user_uuid"}
	if caps.hasCreatedAt {
		columns = append(columns, "created_at")
	}
	if caps.hasUpdatedAt {
		columns = append(columns, "updated_at")
	}

	orderClause := " ORDER BY uuid ASC"
	if caps.hasCreatedAt {
		orderClause = " ORDER BY created_at ASC"
	}

	format := fmt.Sprintf("SELECT %s FROM sessions WHERE user_uuid IN (%%s)%s", strings.Join(columns, ", "), orderClause)
	query, args := buildInQuery(format, uuids)
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []SessionRecord
	for rows.Next() {
		var session SessionRecord
		scanArgs := []any{
			&session.UUID,
			&session.Token,
			&session.ExpiresAt,
			&session.UserUUID,
		}

		var createdAt, updatedAt sql.NullTime
		if caps.hasCreatedAt {
			scanArgs = append(scanArgs, &createdAt)
		}
		if caps.hasUpdatedAt {
			scanArgs = append(scanArgs, &updatedAt)
		}

		if err := rows.Scan(scanArgs...); err != nil {
			return nil, err
		}

		if caps.hasCreatedAt && createdAt.Valid {
			ts := createdAt.Time
			session.CreatedAt = &ts
		}
		if caps.hasUpdatedAt && updatedAt.Valid {
			ts := updatedAt.Time
			session.UpdatedAt = &ts
		}
		sessions = append(sessions, session)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	sort.SliceStable(sessions, func(i, j int) bool {
		if sessions[i].UserUUID == sessions[j].UserUUID {
			switch {
			case sessions[i].CreatedAt == nil && sessions[j].CreatedAt == nil:
				return sessions[i].UUID < sessions[j].UUID
			case sessions[i].CreatedAt == nil:
				return false
			case sessions[j].CreatedAt == nil:
				return true
			default:
				return sessions[i].CreatedAt.Before(*sessions[j].CreatedAt)
			}
		}
		return sessions[i].UserUUID < sessions[j].UserUUID
	})

	return sessions, nil
}

func buildInQuery(format string, uuids []string) (string, []any) {
	placeholders := make([]string, len(uuids))
	args := make([]any, len(uuids))
	for i, id := range uuids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}
	return fmt.Sprintf(format, strings.Join(placeholders, ", ")), args
}

func upsertUser(ctx context.Context, tx *sql.Tx, user *UserRecord) error {
	groupsJSON, err := json.Marshal(user.Groups)
	if err != nil {
		return fmt.Errorf("encode groups for user %s: %w", user.UUID, err)
	}
	permissionsJSON, err := json.Marshal(user.Permissions)
	if err != nil {
		return fmt.Errorf("encode permissions for user %s: %w", user.UUID, err)
	}

	if user.EmailVerifiedAt == nil && user.EmailVerified {
		ts := user.UpdatedAt
		if ts.IsZero() {
			ts = user.CreatedAt
		}
		user.EmailVerifiedAt = &ts
	}

	_, err = tx.ExecContext(ctx, `
INSERT INTO users (
        uuid, username, password, email, email_verified_at,
        level, role, groups, permissions, created_at, updated_at,
        mfa_totp_secret, mfa_enabled, mfa_secret_issued_at, mfa_confirmed_at
) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8::jsonb, $9::jsonb, $10, $11,
        $12, $13, $14, $15
)
ON CONFLICT (uuid) DO UPDATE SET
        username = EXCLUDED.username,
        password = EXCLUDED.password,
        email = EXCLUDED.email,
        email_verified_at = EXCLUDED.email_verified_at,
        level = EXCLUDED.level,
        role = EXCLUDED.role,
        groups = EXCLUDED.groups,
        permissions = EXCLUDED.permissions,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at,
        mfa_totp_secret = EXCLUDED.mfa_totp_secret,
        mfa_enabled = EXCLUDED.mfa_enabled,
        mfa_secret_issued_at = EXCLUDED.mfa_secret_issued_at,
        mfa_confirmed_at = EXCLUDED.mfa_confirmed_at
`,
		user.UUID,
		user.Username,
		user.PasswordHash,
		nullableString(user.Email),
		nullableTime(user.EmailVerifiedAt),
		user.Level,
		user.Role,
		string(groupsJSON),
		string(permissionsJSON),
		user.CreatedAt,
		user.UpdatedAt,
		nullableString(user.MFATOTPSecret),
		user.MFAEnabled,
		nullableTime(user.MFASecretIssuedAt),
		nullableTime(user.MFAConfirmedAt),
	)
	return err
}

func upsertIdentity(ctx context.Context, tx *sql.Tx, identity *IdentityRecord, caps tableColumnCapabilities) error {
	columns := []string{"uuid", "provider", "external_id", "user_uuid"}
	placeholders := []string{"$1", "$2", "$3", "$4"}
	args := []any{identity.UUID, identity.Provider, identity.ExternalID, identity.UserUUID}

	nextIdx := 5
	if caps.hasCreatedAt {
		columns = append(columns, "created_at")
		placeholders = append(placeholders, fmt.Sprintf("$%d", nextIdx))
		args = append(args, nullableTime(identity.CreatedAt))
		nextIdx++
	}
	if caps.hasUpdatedAt {
		columns = append(columns, "updated_at")
		placeholders = append(placeholders, fmt.Sprintf("$%d", nextIdx))
		args = append(args, nullableTime(identity.UpdatedAt))
		nextIdx++
	}

	query := fmt.Sprintf(`
INSERT INTO identities (%s)
VALUES (%s)
ON CONFLICT (uuid) DO UPDATE SET
        provider = EXCLUDED.provider,
        external_id = EXCLUDED.external_id,
        user_uuid = EXCLUDED.user_uuid%s%s
`,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "),
		updateColumnClause(caps.hasCreatedAt, "created_at"),
		updateColumnClause(caps.hasUpdatedAt, "updated_at"),
	)

	_, err := tx.ExecContext(ctx, query, args...)
	return err
}

func upsertSession(ctx context.Context, tx *sql.Tx, session *SessionRecord, caps tableColumnCapabilities) error {
	columns := []string{"uuid", "token", "expires_at", "user_uuid"}
	placeholders := []string{"$1", "$2", "$3", "$4"}
	args := []any{session.UUID, session.Token, session.ExpiresAt, session.UserUUID}

	nextIdx := 5
	if caps.hasCreatedAt {
		columns = append(columns, "created_at")
		placeholders = append(placeholders, fmt.Sprintf("$%d", nextIdx))
		args = append(args, nullableTime(session.CreatedAt))
		nextIdx++
	}
	if caps.hasUpdatedAt {
		columns = append(columns, "updated_at")
		placeholders = append(placeholders, fmt.Sprintf("$%d", nextIdx))
		args = append(args, nullableTime(session.UpdatedAt))
		nextIdx++
	}

	query := fmt.Sprintf(`
INSERT INTO sessions (%s)
VALUES (%s)
ON CONFLICT (uuid) DO UPDATE SET
        token = EXCLUDED.token,
        expires_at = EXCLUDED.expires_at,
        user_uuid = EXCLUDED.user_uuid%s%s
`,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "),
		updateColumnClause(caps.hasCreatedAt, "created_at"),
		updateColumnClause(caps.hasUpdatedAt, "updated_at"),
	)

	_, err := tx.ExecContext(ctx, query, args...)
	return err
}

func nullableString(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}

func nullableTime(t *time.Time) any {
	if t == nil {
		return nil
	}
	return *t
}

type tableColumnCapabilities struct {
	hasCreatedAt bool
	hasUpdatedAt bool
}

func tableColumnCaps(ctx context.Context, db *sql.DB, table string) (tableColumnCapabilities, error) {
	query := `
SELECT column_name
FROM information_schema.columns
WHERE table_schema = ANY (current_schemas(false))
  AND table_name = $1
  AND column_name IN ('created_at', 'updated_at')
`

	rows, err := db.QueryContext(ctx, query, table)
	if err != nil {
		return tableColumnCapabilities{}, err
	}
	defer rows.Close()

	caps := tableColumnCapabilities{}
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return tableColumnCapabilities{}, err
		}
		switch name {
		case "created_at":
			caps.hasCreatedAt = true
		case "updated_at":
			caps.hasUpdatedAt = true
		}
	}
	if err := rows.Err(); err != nil {
		return tableColumnCapabilities{}, err
	}

	return caps, nil
}

func updateColumnClause(enabled bool, column string) string {
	if !enabled {
		return ""
	}
	return fmt.Sprintf(", %s = EXCLUDED.%s", column, column)
}
