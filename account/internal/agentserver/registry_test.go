package agentserver

import (
	"testing"
	"time"

	"account/internal/agentproto"
)

func TestNewRegistryValidation(t *testing.T) {
	_, err := NewRegistry(Config{})
	if err != nil {
		t.Fatalf("unexpected error for empty config: %v", err)
	}

	_, err = NewRegistry(Config{Credentials: []Credential{{ID: "", Token: "token"}}})
	if err == nil {
		t.Fatalf("expected error for empty id")
	}

	_, err = NewRegistry(Config{Credentials: []Credential{{ID: "edge", Token: ""}}})
	if err == nil {
		t.Fatalf("expected error for empty token")
	}

	_, err = NewRegistry(Config{Credentials: []Credential{{ID: "a", Token: "1"}, {ID: "a", Token: "2"}}})
	if err == nil {
		t.Fatalf("expected error for duplicate id")
	}

	_, err = NewRegistry(Config{Credentials: []Credential{{ID: "a", Token: "dup"}, {ID: "b", Token: "dup"}}})
	if err == nil {
		t.Fatalf("expected error for duplicate token")
	}
}

func TestRegistryAuthenticateAndStatus(t *testing.T) {
	registry, err := NewRegistry(Config{Credentials: []Credential{{ID: "edge", Name: "Edge", Token: "secret", Groups: []string{"default"}}}})
	if err != nil {
		t.Fatalf("new registry: %v", err)
	}
	identity, ok := registry.Authenticate("secret")
	if !ok || identity == nil {
		t.Fatalf("expected authentication to succeed")
	}
	if identity.ID != "edge" {
		t.Fatalf("unexpected identity id %q", identity.ID)
	}

	report := agentproto.StatusReport{
		Healthy: true,
		Users:   5,
		Xray: agentproto.XrayStatus{
			Running: true,
			Clients: 5,
		},
	}
	registry.ReportStatus(*identity, report)

	snapshots := registry.Statuses()
	if len(snapshots) != 1 {
		t.Fatalf("expected 1 snapshot, got %d", len(snapshots))
	}
	snapshot := snapshots[0]
	if snapshot.Agent.ID != "edge" {
		t.Fatalf("unexpected snapshot agent id %q", snapshot.Agent.ID)
	}
	if !snapshot.Report.Healthy {
		t.Fatalf("expected healthy report")
	}
	if snapshot.Report.Users != 5 {
		t.Fatalf("unexpected users count %d", snapshot.Report.Users)
	}
	if snapshot.Report.Xray.Clients != 5 {
		t.Fatalf("unexpected xray clients %d", snapshot.Report.Xray.Clients)
	}
	if snapshot.UpdatedAt.IsZero() {
		t.Fatalf("expected updated timestamp")
	}

	// Ensure snapshots include configured agents without reports.
	registry, err = NewRegistry(Config{Credentials: []Credential{{ID: "a", Token: "1"}, {ID: "b", Token: "2"}}})
	if err != nil {
		t.Fatalf("new registry: %v", err)
	}
	snapshots = registry.Statuses()
	if len(snapshots) != 2 {
		t.Fatalf("expected 2 snapshots, got %d", len(snapshots))
	}
	if snapshots[0].Agent.ID != "a" || snapshots[1].Agent.ID != "b" {
		t.Fatalf("unexpected snapshot ordering: %+v", snapshots)
	}

	// Report status with timestamp and ensure Latest is retained.
	now := time.Now().UTC()
	registry.ReportStatus(snapshots[0].Agent, agentproto.StatusReport{Users: 1})
	entries := registry.Statuses()
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
	if entries[0].UpdatedAt.Before(now) {
		t.Fatalf("expected updated timestamp to be after initial time")
	}
}
