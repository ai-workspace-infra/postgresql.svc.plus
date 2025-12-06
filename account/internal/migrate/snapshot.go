package migrate

import (
	"errors"
	"time"

	accountschema "account/sql"
)

// SnapshotVersion identifies the canonical format of exported account snapshots.
const SnapshotVersion = "v1"

// SnapshotMetadata captures provenance information for account snapshots.
type SnapshotMetadata struct {
	Version    string    `yaml:"version"`
	SchemaHash string    `yaml:"schemaHash"`
	ExportedAt time.Time `yaml:"exportedAt"`
}

// validateSnapshotMetadata ensures the provided metadata matches the expected
// snapshot format and schema hash.
func validateSnapshotMetadata(meta *SnapshotMetadata) error {
	if meta == nil {
		return errors.New("snapshot metadata missing (expected version and schema hash)")
	}
	if meta.Version != SnapshotVersion {
		return errors.New("snapshot version mismatch")
	}
	if meta.SchemaHash != accountschema.Hash() {
		return errors.New("snapshot schema hash mismatch")
	}
	return nil
}
