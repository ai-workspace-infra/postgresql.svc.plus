package agentmode

import (
	"context"
	"time"

	"account/internal/xrayconfig"
)

// HTTPClientSource retrieves Xray clients from the controller over HTTP.
type HTTPClientSource struct {
	client  *Client
	tracker *syncTracker
}

// NewHTTPClientSource constructs a source backed by the provided client and
// tracker.
func NewHTTPClientSource(client *Client, tracker *syncTracker) *HTTPClientSource {
	return &HTTPClientSource{client: client, tracker: tracker}
}

// ListClients implements xrayconfig.ClientSource by fetching the latest client
// list via the controller API.
func (s *HTTPClientSource) ListClients(ctx context.Context) ([]xrayconfig.Client, error) {
	resp, err := s.client.ListClients(ctx)
	if err != nil {
		return nil, err
	}
	if s.tracker != nil {
		s.tracker.UpdateFetch(len(resp.Clients), resp.Revision, time.Now().UTC())
	}
	return resp.Clients, nil
}
