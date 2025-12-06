package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/spf13/cobra"

	rconfig "rag-server/internal/rag/config"
	"rag-server/internal/rag/embed"
	"rag-server/internal/rag/ingest"
	"rag-server/internal/rag/store"
	rsync "rag-server/internal/rag/sync"
	"rag-server/proxy"
)

// main synchronizes configured repositories and ingests markdown files.
// When --file is provided only that file is processed; otherwise all markdown
// files from configured datasources are parsed, embedded and upserted.

var (
	configPath string
	filePath   string
	logLevel   string
)

var rootCmd = &cobra.Command{
	Use:   "xcontrol-cli",
	Short: "Synchronize repositories and ingest markdown files",
	Run: func(cmd *cobra.Command, args []string) {
		var level slog.Level
		switch strings.ToLower(logLevel) {
		case "debug":
			level = slog.LevelDebug
		case "warn", "warning":
			level = slog.LevelWarn
		case "error":
			level = slog.LevelError
		default:
			level = slog.LevelInfo
		}
		logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: level}))
		slog.SetDefault(logger)

		var cfg *rconfig.Config
		var err error
		if configPath != "" {
			cfg, err = rconfig.Load(configPath)
			if err != nil {
				slog.Error("load config", "err", err)
				os.Exit(1)
			}
		} else {
			cfg = &rconfig.Config{}
		}

		proxy.Set(cfg.Global.Proxy)

		embCfg := cfg.ResolveEmbedding()
		chunkCfg := cfg.ResolveChunking()

		var embedder embed.Embedder
		switch embCfg.Provider {
		case "ollama":
			embedder = embed.NewOllama(embCfg.Endpoint, embCfg.Model, embCfg.Dimension)
		case "chutes":
			embedder = embed.NewChutes(embCfg.Endpoint, embCfg.APIKey, embCfg.Dimension)
		default:
			if embCfg.Model != "" {
				embedder = embed.NewOpenAI(embCfg.Endpoint, embCfg.APIKey, embCfg.Model, embCfg.Dimension)
			} else {
				embedder = embed.NewBGE(embCfg.Endpoint, embCfg.APIKey, embCfg.Dimension)
			}
		}

		baseURL := strings.TrimRight(os.Getenv("SERVER_URL"), "/")
		if baseURL == "" {
			if resolved := cfg.ResolveServerURL(); resolved != "" {
				baseURL = resolved
			} else {
				baseURL = "http://localhost:8090"
			}
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
		defer cancel()

		if filePath != "" {
			if err := ingestFile(ctx, cfg, chunkCfg, embedder, baseURL, filePath); err != nil {
				slog.Error("ingest file", "err", err)
				os.Exit(1)
			}
			return
		}

		var syncErrs []string
		for _, ds := range cfg.Global.Datasources {
			workdir := filepath.Join(os.TempDir(), "xcontrol", ds.Name)
			err := proxy.With(cfg.Sync.Repo.Proxy, func() error {
				_, err := rsync.SyncRepo(ctx, ds.Repo, workdir)
				return err
			})
			if err != nil {
				slog.Warn("sync repo", "repo", ds.Name, "err", err)
				syncErrs = append(syncErrs, ds.Name)
				continue
			}
			root := filepath.Join(workdir, ds.Path)
			files, err := ingest.ListMarkdown(root, chunkCfg.IncludeExts, chunkCfg.IgnoreDirs, 0)
			if err != nil {
				slog.Error("list markdown", "err", err)
				os.Exit(1)
			}
			for _, f := range files {
				if err := ingestFile(ctx, cfg, chunkCfg, embedder, baseURL, f); err != nil {
					slog.Warn("ingest file", "file", f, "err", err)
				}
			}
		}
		if len(syncErrs) > 0 {
			slog.Error("failed to sync repositories", "repos", strings.Join(syncErrs, ", "))
			os.Exit(1)
		}
	},
}

func init() {
	rootCmd.Flags().StringVar(&configPath, "config", "", "Path to server RAG configuration file")
	rootCmd.Flags().StringVar(&filePath, "file", "", "Markdown file to embed and upsert")
	rootCmd.Flags().StringVar(&logLevel, "log-level", "info", "log level (debug, info, warn, error)")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func ingestFile(ctx context.Context, cfg *rconfig.Config, chunkCfg rconfig.ChunkingCfg, embedder embed.Embedder, baseURL, filePath string) error {
	var ds *rconfig.DataSource
	var workdir string
	for i := range cfg.Global.Datasources {
		wd := filepath.Join(os.TempDir(), "xcontrol", cfg.Global.Datasources[i].Name)
		if strings.HasPrefix(filePath, wd) {
			ds = &cfg.Global.Datasources[i]
			workdir = wd
			break
		}
	}
	if ds == nil {
		return fmt.Errorf("file %s not under any datasource", filePath)
	}

	secs, err := ingest.ParseMarkdown(filePath)
	if err != nil {
		return fmt.Errorf("parse markdown: %w", err)
	}
	chunks, err := ingest.BuildChunks(secs, chunkCfg)
	if err != nil {
		return fmt.Errorf("build chunks: %w", err)
	}
	texts := make([]string, len(chunks))
	rows := make([]store.DocRow, len(chunks))
	rel := strings.TrimPrefix(filePath, workdir+"/")
	for i, ch := range chunks {
		texts[i] = ch.Text
		rows[i] = store.DocRow{
			Repo:       ds.Repo,
			Path:       rel,
			ChunkID:    ch.ChunkID,
			Content:    ch.Text,
			Metadata:   ch.Meta,
			ContentSHA: ch.SHA256,
		}
	}
	vecs, _, err := embedder.Embed(ctx, texts)
	if err != nil {
		return fmt.Errorf("embed %s: %w", filePath, err)
	}
	for i := range rows {
		rows[i].Embedding = vecs[i]
	}
	payload := struct {
		Docs []store.DocRow `json:"docs"`
	}{Docs: rows}
	b, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal docs: %w", err)
	}
	var resp *http.Response
	var req *http.Request
	for i := 0; i < 3; i++ {
		req, err = http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/api/rag/upsert", bytes.NewReader(b))
		if err != nil {
			return fmt.Errorf("create request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err = http.DefaultClient.Do(req)
		if err == nil {
			break
		}
		time.Sleep(time.Second * time.Duration(i+1))
	}
	if err != nil {
		return fmt.Errorf("upsert request: %w", err)
	}
	if resp == nil {
		return fmt.Errorf("upsert request returned no response")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upsert failed: %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	slog.Info("ingested chunks", "count", len(rows), "file", rel)
	return nil
}
