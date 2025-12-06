package migrate

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"account/internal/utils"
)

// Checker compares two PostgreSQL schemas (CN vs Global) and optionally fixes
// missing structures on the CN side.
type Checker struct{}

func NewChecker() *Checker {
	return &Checker{}
}

func (c *Checker) Check(ctx context.Context, cnDSN, globalDSN string, autoFix bool) error {
	if cnDSN == "" || globalDSN == "" {
		return errors.New("both --cn and --global DSNs are required")
	}

	cnDump, err := utils.RunPgDump(ctx, cnDSN)
	if err != nil {
		return fmt.Errorf("dump CN schema: %w", err)
	}
	globalDump, err := utils.RunPgDump(ctx, globalDSN)
	if err != nil {
		return fmt.Errorf("dump Global schema: %w", err)
	}

	cnStatements := utils.NormalizeStatements(cnDump)
	globalStatements := utils.NormalizeStatements(globalDump)

	onlyCN, onlyGlobal := utils.CompareStatements(cnStatements, globalStatements)

	if len(onlyCN) == 0 && len(onlyGlobal) == 0 {
		fmt.Println("✅ CN and Global schemas are consistent")
		return nil
	}

	if len(onlyGlobal) > 0 {
		fmt.Println("⚠️  Statements missing on CN (present on Global):")
		for _, stmt := range onlyGlobal {
			fmt.Printf("  + %s;\n", stmt)
		}
	}

	if len(onlyCN) > 0 {
		fmt.Println("⚠️  Statements only found on CN:")
		for _, stmt := range onlyCN {
			fmt.Printf("  - %s;\n", stmt)
		}
	}

	if autoFix && len(onlyGlobal) > 0 {
		if err := applyStatements(ctx, cnDSN, onlyGlobal); err != nil {
			return fmt.Errorf("apply auto-fix: %w", err)
		}
		fmt.Println("✅ Auto-fix applied on CN database — please re-run check to confirm")
		// After auto-fix we still return an error if CN has extra statements.
		if len(onlyCN) > 0 {
			return errors.New("schema differences remain on CN after auto-fix")
		}
		return nil
	}

	return errors.New("schema differences detected")
}

func applyStatements(ctx context.Context, dsn string, statements []string) error {
	db, err := openDB(ctx, dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, stmt := range statements {
		if strings.Contains(stmt, "pglogical") {
			continue
		}
		sql := stmt
		if !strings.HasSuffix(sql, ";") {
			sql += ";"
		}
		fmt.Printf("→ Applying fix: %s\n", sql)
		if _, err := tx.ExecContext(ctx, sql); err != nil {
			return err
		}
		fmt.Printf("✅ Applied fix\n")
	}

	return tx.Commit()
}
