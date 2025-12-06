package agentmode

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"account/config"
	"account/internal/agentproto"
	"account/internal/xrayconfig"
)

// Options configures the agent runtime.
type Options struct {
	Logger *slog.Logger
	Agent  config.Agent
	Xray   config.Xray
}

// Run launches the agent mode control loop. It blocks until the context is
// cancelled or a fatal error occurs during setup.
func Run(ctx context.Context, opts Options) error {
	if ctx == nil {
		return errors.New("context is required")
	}

	logger := opts.Logger
	if logger == nil {
		logger = slog.Default()
	}

	controllerURL := strings.TrimSpace(opts.Agent.ControllerURL)
	if controllerURL == "" {
		return errors.New("agent.controllerUrl is required")
	}
	token := strings.TrimSpace(opts.Agent.APIToken)
	if token == "" {
		return errors.New("agent.apiToken is required")
	}

	syncInterval := opts.Agent.SyncInterval
	if syncInterval <= 0 {
		syncInterval = opts.Xray.Sync.Interval
	}
	if syncInterval <= 0 {
		syncInterval = 5 * time.Minute
	}

	statusInterval := opts.Agent.StatusInterval
	if statusInterval <= 0 {
		statusInterval = time.Minute
	}

	httpTimeout := opts.Agent.HTTPTimeout
	if httpTimeout <= 0 {
		httpTimeout = 15 * time.Second
	}

	outputPath := strings.TrimSpace(opts.Xray.Sync.OutputPath)
	if outputPath == "" {
		outputPath = "/usr/local/etc/xray/config.json"
	}

	client, err := NewClient(controllerURL, token, ClientOptions{
		Timeout:            httpTimeout,
		InsecureSkipVerify: opts.Agent.TLS.InsecureSkipVerify,
		UserAgent:          buildUserAgent(opts.Agent.ID),
	})
	if err != nil {
		return err
	}

	tracker := newSyncTracker()
	source := NewHTTPClientSource(client, tracker)

	generator := xrayconfig.Generator{Definition: xrayconfig.DefaultDefinition(), OutputPath: outputPath}
	if templatePath := strings.TrimSpace(opts.Xray.Sync.TemplatePath); templatePath != "" {
		payload, err := os.ReadFile(templatePath)
		if err != nil {
			return fmt.Errorf("load xray template %s: %w", templatePath, err)
		}
		generator.Definition = xrayconfig.JSONDefinition{Raw: append([]byte(nil), payload...)}
	}

	syncLogger := logger.With("component", "agent-xray-sync")
	syncer, err := xrayconfig.NewPeriodicSyncer(xrayconfig.PeriodicOptions{
		Logger:          syncLogger,
		Interval:        syncInterval,
		Source:          source,
		Generator:       generator,
		ValidateCommand: opts.Xray.Sync.ValidateCommand,
		RestartCommand:  opts.Xray.Sync.RestartCommand,
		OnSync: func(result xrayconfig.SyncResult) {
			if result.Error != nil {
				tracker.MarkError(result.Error, result.CompletedAt)
				return
			}
			tracker.MarkSuccess(result.CompletedAt)
		},
	})
	if err != nil {
		return err
	}

	stopSync, err := syncer.Start(ctx)
	if err != nil {
		return err
	}
	defer func() {
		waitCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := stopSync(waitCtx); err != nil {
			logger.Warn("xray syncer shutdown", "err", err)
		}
	}()

	reporterCtx, reporterCancel := context.WithCancel(ctx)
	defer reporterCancel()

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		runStatusReporter(reporterCtx, client, tracker, statusInterval, syncInterval, logger)
	}()

	<-ctx.Done()
	reporterCancel()
	wg.Wait()
	return nil
}

func buildUserAgent(id string) string {
	id = strings.TrimSpace(id)
	if id == "" {
		return "xcontrol-agent"
	}
	return fmt.Sprintf("xcontrol-agent/%s", id)
}

func runStatusReporter(ctx context.Context, client *Client, tracker *syncTracker, interval, syncInterval time.Duration, logger *slog.Logger) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	send := func() {
		snapshot := tracker.Snapshot()
		report := buildStatusReport(snapshot, syncInterval)
		if err := client.ReportStatus(ctx, report); err != nil {
			logger.Warn("failed to report agent status", "err", err)
		}
	}

	send()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			send()
		}
	}
}

func buildStatusReport(snapshot trackerSnapshot, syncInterval time.Duration) agentproto.StatusReport {
	healthy := snapshot.LastError == "" && !snapshot.LastSuccess.IsZero()

	running := false
	var lastSyncPtr *time.Time
	if !snapshot.LastSuccess.IsZero() {
		running = time.Since(snapshot.LastSuccess) <= 3*syncInterval
		last := snapshot.LastSuccess
		lastSyncPtr = &last
	}

	report := agentproto.StatusReport{
		Healthy:      healthy,
		Message:      snapshot.LastError,
		Users:        snapshot.Clients,
		SyncRevision: snapshot.Revision,
		Xray: agentproto.XrayStatus{
			Running: running,
			Clients: snapshot.Clients,
			LastSync: func() *time.Time {
				if lastSyncPtr == nil {
					return nil
				}
				copy := *lastSyncPtr
				return &copy
			}(),
		},
	}

	return report
}
