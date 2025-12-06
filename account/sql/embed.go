package schema

import (
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"sync"
)

//go:embed schema.sql
var schemaFile []byte

var (
	hashOnce sync.Once
	hash     string
)

// Hash returns the SHA-256 hash of the canonical schema.sql file.
func Hash() string {
	hashOnce.Do(func() {
		sum := sha256.Sum256(schemaFile)
		hash = hex.EncodeToString(sum[:])
	})
	return hash
}
