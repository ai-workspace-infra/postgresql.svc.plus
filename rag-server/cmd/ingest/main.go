package main

import (
	"context"
	"flag"
	"log"
	"runtime"

	cfgpkg "rag-server/internal/rag/config"
	"rag-server/internal/rag/ingest"
	"rag-server/proxy"
)

func main() {
	configPath := flag.String("config", "rag-server/config/server.yaml", "config path")
	onlyRepo := flag.String("only-repo", "", "only ingest repo by name")
	dryRun := flag.Bool("dry-run", false, "dry run")
	maxFiles := flag.Int("max-files", 0, "limit number of files")
	migrateDim := flag.Bool("migrate-dim", false, "auto migrate embedding dimension")
	concurrency := flag.Int("concurrency", runtime.NumCPU()*2, "concurrent workers")
	flag.Parse()

	cfg, err := cfgpkg.Load(*configPath)
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	proxy.Set(cfg.Global.Proxy)

	ctx := context.Background()
	opt := ingest.Options{MaxFiles: *maxFiles, DryRun: *dryRun, MigrateDim: *migrateDim, Concurrency: *concurrency}

	for _, ds := range cfg.Global.Datasources {
		if *onlyRepo != "" && ds.Name != *onlyRepo {
			continue
		}
		st, err := ingest.IngestRepo(ctx, cfg, ds, opt)
		if err != nil {
			log.Printf("ingest %s error: %v", ds.Name, err)
		}
		log.Printf("%s: files_scanned=%d chunks_built=%d embeddings_created=%d rows_upserted=%d elapsed=%s", ds.Name, st.FilesScanned, st.ChunksBuilt, st.EmbeddingsCreated, st.RowsUpserted, st.Elapsed)
	}
}
