package ingest

import (
	"context"
	"path/filepath"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	cfgpkg "rag-server/internal/rag/config"
	"rag-server/internal/rag/embed"
	"rag-server/internal/rag/store"
	rsync "rag-server/internal/rag/sync"
	"rag-server/proxy"
)

// Options control ingestion behaviour.
type Options struct {
	MaxFiles    int
	DryRun      bool
	MigrateDim  bool
	Concurrency int
}

// Stats captures pipeline statistics.
type Stats struct {
	FilesScanned, FilesSkipped int
	ChunksBuilt, ChunksSkipped int
	EmbeddingsCreated          int
	RowsUpserted               int
	TokensEstimated            int
	Elapsed                    time.Duration
	Errors                     []error
}

// IngestRepo performs the full ingestion pipeline for a datasource.
func IngestRepo(ctx context.Context, cfg *cfgpkg.Config, ds cfgpkg.DataSource, opt Options) (Stats, error) {
	start := time.Now()
	var st Stats

	chunkCfg := cfg.ResolveChunking()
	embCfg := cfg.ResolveEmbedding()

	workdir := filepath.Join("internal", "rag", ds.Name)
	if err := proxy.With(cfg.Sync.Repo.Proxy, func() error {
		_, err := rsync.SyncRepo(ctx, ds.Repo, workdir)
		return err
	}); err != nil {
		st.Errors = append(st.Errors, err)
		return st, err
	}

	root := filepath.Join(workdir, ds.Path)
	files, err := ListMarkdown(root, chunkCfg.IncludeExts, chunkCfg.IgnoreDirs, opt.MaxFiles)
	if err != nil {
		st.Errors = append(st.Errors, err)
		return st, err
	}
	st.FilesScanned = len(files)

	dsn := cfg.Global.VectorDB.DSN()
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		st.Errors = append(st.Errors, err)
		return st, err
	}
	defer conn.Close(ctx)

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
	if err := store.EnsureSchema(ctx, conn, embedder.Dimension(), opt.MigrateDim); err != nil {
		st.Errors = append(st.Errors, err)
		return st, err
	}

	for _, f := range files {
		secs, err := ParseMarkdown(f)
		if err != nil {
			st.Errors = append(st.Errors, err)
			continue
		}
		chunks, err := BuildChunks(secs, chunkCfg)
		if err != nil {
			st.Errors = append(st.Errors, err)
			continue
		}
		if len(chunks) == 0 {
			continue
		}
		st.ChunksBuilt += len(chunks)
		texts := make([]string, len(chunks))
		rows := make([]store.DocRow, len(chunks))
		for i, ch := range chunks {
			texts[i] = ch.Text
			rows[i] = store.DocRow{
				Repo:       ds.Repo,
				Path:       strings.TrimPrefix(f, workdir+"/"),
				ChunkID:    ch.ChunkID,
				Content:    ch.Text,
				Metadata:   ch.Meta,
				ContentSHA: ch.SHA256,
			}
		}
		vecs, tokens, err := embedder.Embed(ctx, texts)
		if err != nil {
			st.Errors = append(st.Errors, err)
			continue
		}
		st.EmbeddingsCreated += len(vecs)
		st.TokensEstimated += tokens
		for i := range rows {
			rows[i].Embedding = vecs[i]
		}
		if opt.DryRun {
			continue
		}
		n, err := store.UpsertDocuments(ctx, conn, rows)
		if err != nil {
			st.Errors = append(st.Errors, err)
			continue
		}
		st.RowsUpserted += n
	}

	st.Elapsed = time.Since(start)
	return st, nil
}
