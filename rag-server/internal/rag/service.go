package rag

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"

	"github.com/jackc/pgx/v5"
	pgvector "github.com/pgvector/pgvector-go"

	"rag-server/internal/rag/config"
	"rag-server/internal/rag/embed"
	"rag-server/internal/rag/rerank"
	"rag-server/internal/rag/store"
)

type Service struct {
	cfg *config.Config
}

func New(cfg *config.Config) *Service {
	return &Service{cfg: cfg}
}

// Upsert stores pre-embedded documents into the vector database.
func (s *Service) Upsert(ctx context.Context, rows []store.DocRow) (int, error) {
	if s == nil || s.cfg == nil || len(rows) == 0 {
		return 0, nil
	}
	dsn := s.cfg.Global.VectorDB.DSN()
	if dsn == "" {
		return 0, nil
	}
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		return 0, err
	}
	defer conn.Close(ctx)

	dim := len(rows[0].Embedding)
	// Allow schema migration so the embedding dimension can be updated
	if err := store.EnsureSchema(ctx, conn, dim, true); err != nil {
		return 0, err
	}
	return store.UpsertDocuments(ctx, conn, rows)
}

type Document struct {
	Repo     string         `json:"repo"`
	Path     string         `json:"path"`
	ChunkID  int            `json:"chunk_id"`
	Content  string         `json:"content"`
	Metadata map[string]any `json:"metadata"`
}

func (s *Service) Query(ctx context.Context, question string, limit int) ([]Document, error) {
	if s == nil || s.cfg == nil {
		return nil, nil
	}
	embCfg := s.cfg.ResolveEmbedding()
	if embCfg.Endpoint == "" {
		return nil, nil
	}
	var emb embed.Embedder
	switch embCfg.Provider {
	case "ollama":
		emb = embed.NewOllama(embCfg.Endpoint, embCfg.Model, embCfg.Dimension)
	case "chutes":
		emb = embed.NewChutes(embCfg.Endpoint, embCfg.APIKey, embCfg.Dimension)
	default:
		if embCfg.Model != "" {
			emb = embed.NewOpenAI(embCfg.Endpoint, embCfg.APIKey, embCfg.Model, embCfg.Dimension)
		} else {
			emb = embed.NewBGE(embCfg.Endpoint, embCfg.APIKey, embCfg.Dimension)
		}
	}
	vecs, _, err := emb.Embed(ctx, []string{question})
	if err != nil {
		return nil, err
	}
	if len(vecs) == 0 {
		return nil, nil
	}
	dsn := s.cfg.Global.VectorDB.DSN()
	if dsn == "" {
		return nil, nil
	}
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		return nil, err
	}
	defer conn.Close(ctx)

	alpha := s.cfg.Retrieval.Alpha
	if alpha < 0 || alpha > 1 {
		alpha = 0.5
	}
	cand := s.cfg.Retrieval.Candidates
	if cand <= 0 {
		cand = 50
	}

	type scored struct {
		Document
		vscore float64
		tscore float64
		score  float64
	}
	docsMap := map[string]*scored{}

	vrows, err := conn.Query(ctx, `SELECT repo,path,chunk_id,content,metadata, embedding <#> $1 AS dist FROM documents WHERE embedding IS NOT NULL ORDER BY embedding <#> $1 LIMIT $2`,
		pgvector.NewVector(vecs[0]), cand)
	if err != nil {
		return nil, err
	}
	for vrows.Next() {
		var d scored
		var metaBytes []byte
		var dist float64
		if err := vrows.Scan(&d.Repo, &d.Path, &d.ChunkID, &d.Content, &metaBytes, &dist); err != nil {
			vrows.Close()
			return nil, err
		}
		if len(metaBytes) > 0 {
			_ = json.Unmarshal(metaBytes, &d.Metadata)
		}
		d.vscore = -dist
		key := fmt.Sprintf("%s|%s|%d", d.Repo, d.Path, d.ChunkID)
		docsMap[key] = &d
	}
	vrows.Close()

	trows, err := conn.Query(ctx, `SELECT repo,path,chunk_id,content,metadata, ts_rank_cd(content_tsv, websearch_to_tsquery('zhcn_search', $1)) AS rank FROM documents WHERE content_tsv @@ websearch_to_tsquery('zhcn_search', $1) ORDER BY rank DESC LIMIT $2`,
		question, cand)
	if err != nil {
		return nil, err
	}
	for trows.Next() {
		var metaBytes []byte
		var rank float64
		key := ""
		d := scored{}
		if err := trows.Scan(&d.Repo, &d.Path, &d.ChunkID, &d.Content, &metaBytes, &rank); err != nil {
			trows.Close()
			return nil, err
		}
		if len(metaBytes) > 0 {
			_ = json.Unmarshal(metaBytes, &d.Metadata)
		}
		d.tscore = rank
		key = fmt.Sprintf("%s|%s|%d", d.Repo, d.Path, d.ChunkID)
		if exist, ok := docsMap[key]; ok {
			exist.tscore = d.tscore
		} else {
			docsMap[key] = &d
		}
	}
	trows.Close()

	candidates := make([]*scored, 0, len(docsMap))
	for _, d := range docsMap {
		d.score = alpha*d.vscore + (1-alpha)*d.tscore
		candidates = append(candidates, d)
	}
	sort.Slice(candidates, func(i, j int) bool { return candidates[i].score > candidates[j].score })
	if len(candidates) > cand {
		candidates = candidates[:cand]
	}

	// optional reranking
	var rr rerank.Reranker
	rCfg := s.cfg.Models.Reranker
	if rCfg.Endpoint != "" {
		rr = rerank.NewBGE(rCfg.Endpoint, rCfg.Token)
	}
	if rr != nil {
		docs := make([]string, len(candidates))
		for i, c := range candidates {
			docs[i] = c.Content
		}
		if scores, err := rr.Rerank(ctx, question, docs); err == nil && len(scores) == len(candidates) {
			for i := range candidates {
				candidates[i].score = float64(scores[i])
			}
			sort.Slice(candidates, func(i, j int) bool { return candidates[i].score > candidates[j].score })
		}
	}

	if limit > len(candidates) {
		limit = len(candidates)
	}
	out := make([]Document, 0, limit)
	for i := 0; i < limit; i++ {
		out = append(out, candidates[i].Document)
	}
	return out, nil
}
