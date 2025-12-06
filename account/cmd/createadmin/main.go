package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"

	"account/internal/store"
)

func main() {
	var (
		driver          = flag.String("driver", "postgres", "database driver (postgres, memory)")
		dsn             = flag.String("dsn", "", "database connection string")
		username        = flag.String("username", "", "super administrator username")
		password        = flag.String("password", "", "super administrator password")
		email           = flag.String("email", "", "super administrator email (optional)")
		groups          = flag.String("groups", "", "comma separated list of groups to assign (optional)")
		permissions     = flag.String("permissions", "", "comma separated list of permissions to assign (optional)")
		currentPassword = flag.String("current-password", "", "current super administrator password (required when updating)")
		mfaCode         = flag.String("mfa", "", "MFA TOTP code for the current super administrator (required when MFA is enabled)")
	)
	flag.Parse()

	if err := run(*driver, *dsn, *username, *password, *email, *groups, *permissions, *currentPassword, *mfaCode); err != nil {
		log.Fatalf("failed to create super administrator: %v", err)
	}
}

func run(driver, dsn, username, password, email, groups, permissions, currentPassword, mfaCode string) error {
	driver = strings.TrimSpace(driver)
	dsn = strings.TrimSpace(dsn)
	username = strings.TrimSpace(username)
	password = strings.TrimSpace(password)
	email = strings.TrimSpace(email)
	groups = strings.TrimSpace(groups)
	permissions = strings.TrimSpace(permissions)
	currentPassword = strings.TrimSpace(currentPassword)
	mfaCode = strings.TrimSpace(mfaCode)

	if username == "" {
		return errors.New("username is required")
	}
	if dsn == "" && !strings.EqualFold(driver, "memory") {
		return errors.New("dsn is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	storeConfig := store.Config{
		Driver:                  driver,
		DSN:                     dsn,
		AllowSuperAdminCounting: true,
	}

	s, cleanup, err := store.New(ctx, storeConfig)
	if err != nil {
		return err
	}
	defer func() {
		_ = cleanup(context.Background())
	}()

	configuredGroups := parseCSV(groups)
	configuredPermissions := parseCSV(permissions)

	user, err := s.GetUserByName(ctx, username)
	if err != nil {
		if !errors.Is(err, store.ErrUserNotFound) {
			return err
		}
	}

	superAdminCount, err := countSuperAdmins(ctx, s)
	if err != nil {
		return err
	}

	if user == nil {
		if superAdminCount > 0 {
			return errors.New("super administrator already exists")
		}
		if password == "" {
			return errors.New("password is required")
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password: %w", err)
		}

		newUser := &store.User{
			Name:          username,
			Email:         email,
			PasswordHash:  string(hashed),
			Level:         store.LevelAdmin,
			Role:          store.RoleAdmin,
			Groups:        ensureSuperAdminGroups(configuredGroups, nil),
			Permissions:   ensureSuperAdminPermissions(configuredPermissions, nil),
			EmailVerified: true,
		}

		if err := s.CreateUser(ctx, newUser); err != nil {
			if errors.Is(err, store.ErrEmailExists) {
				return fmt.Errorf("email already exists: %w", err)
			}
			if errors.Is(err, store.ErrNameExists) {
				return fmt.Errorf("username already exists: %w", err)
			}
			return err
		}

		fmt.Fprintf(os.Stdout, "Created super administrator %s (id=%s)\n", newUser.Name, newUser.ID)
		return nil
	}

	if superAdminCount > 1 {
		return errors.New("multiple super administrators detected; resolve manually before continuing")
	}

	if user.PasswordHash != "" {
		if currentPassword == "" {
			return errors.New("current password is required to update the super administrator")
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(currentPassword)); err != nil {
			return errors.New("current password verification failed")
		}
	}

	if user.MFAEnabled {
		if mfaCode == "" {
			return errors.New("mfa code is required for this super administrator")
		}
		valid, err := totp.ValidateCustom(mfaCode, user.MFATOTPSecret, time.Now().UTC(), totp.ValidateOpts{
			Period:    30,
			Skew:      1,
			Digits:    otp.DigitsSix,
			Algorithm: otp.AlgorithmSHA1,
		})
		if err != nil {
			return fmt.Errorf("validate mfa code: %w", err)
		}
		if !valid {
			return errors.New("invalid mfa code provided")
		}
	}

	updated := *user
	if email != "" {
		updated.Email = email
	}
	if password != "" {
		hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password: %w", err)
		}
		updated.PasswordHash = string(hashed)
	}

	updated.Groups = ensureSuperAdminGroups(configuredGroups, user.Groups)
	updated.Permissions = ensureSuperAdminPermissions(configuredPermissions, user.Permissions)
	updated.EmailVerified = updated.Email != ""
	updated.Role = store.RoleAdmin
	updated.Level = store.LevelAdmin
	updated.UpdatedAt = time.Now().UTC()

	if err := s.UpdateUser(ctx, &updated); err != nil {
		if errors.Is(err, store.ErrEmailExists) {
			return fmt.Errorf("email already exists: %w", err)
		}
		if errors.Is(err, store.ErrNameExists) {
			return fmt.Errorf("username already exists: %w", err)
		}
		return err
	}

	fmt.Fprintf(os.Stdout, "Updated super administrator %s (id=%s)\n", updated.Name, updated.ID)
	return nil
}

func countSuperAdmins(ctx context.Context, s store.Store) (int, error) {
	type superAdminCounter interface {
		CountSuperAdmins(ctx context.Context) (int, error)
	}

	if counter, ok := s.(superAdminCounter); ok {
		count, err := counter.CountSuperAdmins(ctx)
		if errors.Is(err, store.ErrSuperAdminCountingDisabled) {
			return 0, errors.New("store does not permit super administrator counting; enable it explicitly to proceed")
		}
		return count, err
	}
	return 0, errors.New("store does not support super administrator discovery")
}

func parseCSV(input string) []string {
	if input == "" {
		return nil
	}
	parts := strings.Split(input, ",")
	result := make([]string, 0, len(parts))
	seen := make(map[string]struct{})
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		lowered := strings.ToLower(trimmed)
		if _, exists := seen[lowered]; exists {
			continue
		}
		seen[lowered] = struct{}{}
		result = append(result, trimmed)
	}
	if len(result) == 0 {
		return nil
	}
	sort.Strings(result)
	return result
}

func ensureSuperAdminGroups(configured, existing []string) []string {
	base := mergeValues(existing, configured)
	if !containsCaseInsensitive(base, "Admin") {
		base = append(base, "Admin")
	}
	return normalizeResult(base)
}

func ensureSuperAdminPermissions(configured, existing []string) []string {
	base := mergeValues(existing, configured)
	if !containsExact(base, "*") {
		base = append(base, "*")
	}
	return normalizeResult(base)
}

func mergeValues(existing, configured []string) []string {
	values := make([]string, 0, len(existing)+len(configured))
	values = append(values, existing...)
	values = append(values, configured...)
	return values
}

func containsCaseInsensitive(values []string, target string) bool {
	if target == "" {
		return false
	}
	targetLower := strings.ToLower(target)
	for _, value := range values {
		if strings.ToLower(strings.TrimSpace(value)) == targetLower {
			return true
		}
	}
	return false
}

func containsExact(values []string, target string) bool {
	for _, value := range values {
		if strings.TrimSpace(value) == target {
			return true
		}
	}
	return false
}

func normalizeResult(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	normalized := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		key := strings.ToLower(trimmed)
		if trimmed == "*" {
			key = "*"
		}
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, trimmed)
	}
	sort.Strings(normalized)
	return normalized
}
