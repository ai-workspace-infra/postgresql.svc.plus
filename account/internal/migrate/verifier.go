package migrate

import (
	"context"
	"errors"
	"fmt"
	"os"

	"account/internal/utils"
)

const defaultSchemaPath = "account/sql/schema.sql"

// Verifier validates that the live database matches the canonical schema.sql.
type Verifier struct{}

func NewVerifier() *Verifier {
	return &Verifier{}
}

func (v *Verifier) Verify(ctx context.Context, dsn, schemaPath string) error {
	if dsn == "" {
		return errors.New("--dsn is required")
	}
	if schemaPath == "" {
		schemaPath = defaultSchemaPath
	}

	dump, err := utils.RunPgDump(ctx, dsn)
	if err != nil {
		return fmt.Errorf("dump database schema: %w", err)
	}

	schemaBytes, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("read schema file: %w", err)
	}

	dbStatements := utils.NormalizeStatements(dump)
	fileStatements := utils.NormalizeStatements(string(schemaBytes))

	onlyDB, onlyFile := utils.CompareStatements(dbStatements, fileStatements)

	if len(onlyDB) == 0 && len(onlyFile) == 0 {
		fmt.Println("✅ Database schema matches schema.sql")
		return nil
	}

	if len(onlyFile) > 0 {
		fmt.Println("⚠️  Statements missing from database (present in schema.sql):")
		for _, stmt := range onlyFile {
			fmt.Printf("  + %s;\n", stmt)
		}
	}

	if len(onlyDB) > 0 {
		fmt.Println("⚠️  Extra statements found in database:")
		for _, stmt := range onlyDB {
			fmt.Printf("  - %s;\n", stmt)
		}
	}

	return errors.New("schema mismatch detected")
}
