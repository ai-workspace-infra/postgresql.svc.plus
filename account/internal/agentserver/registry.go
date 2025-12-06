package agentserver

import (
	"crypto/sha256"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"

	"account/internal/agentproto"
)

// Credential defines the authentication material assigned to a managed agent.
type Credential struct {
	ID     string   `yaml:"id"`
	Name   string   `yaml:"name"`
	Token  string   `yaml:"token"`
	Groups []string `yaml:"groups"`
}

// Config groups the credential set exposed through configuration.
type Config struct {
	Credentials []Credential `yaml:"credentials"`
}

// Identity represents an authenticated agent instance.
type Identity struct {
	ID     string
	Name   string
	Groups []string
}

// StatusSnapshot captures the last reported status for an agent.
type StatusSnapshot struct {
	Agent     Identity
	Report    agentproto.StatusReport
	UpdatedAt time.Time
}

// Registry manages agent credentials and status reports in-memory.
type Registry struct {
	mu          sync.RWMutex
	credentials map[[32]byte]Identity
	byID        map[string]Identity
	statuses    map[string]StatusSnapshot
}

// NewRegistry constructs a registry from configuration, validating credentials
// and normalising their representation.
func NewRegistry(cfg Config) (*Registry, error) {
	r := &Registry{
		credentials: make(map[[32]byte]Identity),
		byID:        make(map[string]Identity),
		statuses:    make(map[string]StatusSnapshot),
	}

	for _, cred := range cfg.Credentials {
		id := strings.TrimSpace(cred.ID)
		token := strings.TrimSpace(cred.Token)
		if id == "" {
			return nil, errors.New("agent credential id is required")
		}
		if token == "" {
			return nil, errors.New("agent credential token is required")
		}
		if _, exists := r.byID[id]; exists {
			return nil, errors.New("duplicate agent credential id: " + id)
		}

		digest := sha256.Sum256([]byte(token))
		if _, exists := r.credentials[digest]; exists {
			return nil, errors.New("duplicate agent credential token")
		}

		identity := Identity{
			ID:     id,
			Name:   strings.TrimSpace(cred.Name),
			Groups: normalizeStrings(cred.Groups),
		}
		r.credentials[digest] = identity
		r.byID[id] = identity
	}

	return r, nil
}

// Authenticate validates the provided token and returns the associated agent
// identity when successful.
func (r *Registry) Authenticate(token string) (*Identity, bool) {
	token = strings.TrimSpace(token)
	if token == "" {
		return nil, false
	}
	digest := sha256.Sum256([]byte(token))

	r.mu.RLock()
	identity, ok := r.credentials[digest]
	r.mu.RUnlock()
	if !ok {
		return nil, false
	}

	copy := identity
	return &copy, true
}

// ReportStatus records the status report for the provided agent identity.
func (r *Registry) ReportStatus(agent Identity, report agentproto.StatusReport) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.statuses[agent.ID] = StatusSnapshot{
		Agent:     agent,
		Report:    report,
		UpdatedAt: time.Now().UTC(),
	}
}

// Statuses returns the latest status snapshot for all agents sorted by ID.
func (r *Registry) Statuses() []StatusSnapshot {
	r.mu.RLock()
	defer r.mu.RUnlock()

	snapshots := make([]StatusSnapshot, 0, len(r.byID))
	for id, identity := range r.byID {
		snapshot, ok := r.statuses[id]
		if !ok {
			snapshot = StatusSnapshot{Agent: identity}
		}
		snapshots = append(snapshots, snapshot)
	}

	sort.Slice(snapshots, func(i, j int) bool {
		return snapshots[i].Agent.ID < snapshots[j].Agent.ID
	})

	return snapshots
}

// Agents returns the configured agent identities in a deterministic order.
func (r *Registry) Agents() []Identity {
	r.mu.RLock()
	defer r.mu.RUnlock()

	agents := make([]Identity, 0, len(r.byID))
	for _, identity := range r.byID {
		agents = append(agents, identity)
	}
	sort.Slice(agents, func(i, j int) bool {
		return agents[i].ID < agents[j].ID
	})
	return agents
}

// normalizeStrings trims whitespace and removes duplicates from the provided
// slice while preserving the original order for unique entries.
func normalizeStrings(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, exists := seen[trimmed]; exists {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}
	if len(result) == 0 {
		return nil
	}
	return result
}
