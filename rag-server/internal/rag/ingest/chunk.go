package ingest

import (
	"sort"
	"strings"

	cfgpkg "rag-server/internal/rag/config"
)

// Chunk represents a piece of text prepared for embedding.
type Chunk struct {
	ChunkID int
	Text    string
	Tokens  int
	SHA256  string
	Meta    map[string]any
}

// BuildChunks splits sections into chunks based on configuration.
// Token counting uses a best-effort approach by words when tiktoken fails.
func BuildChunks(secs []Section, cfg cfgpkg.ChunkingCfg) ([]Chunk, error) {
	var chunks []Chunk
	seen := make(map[string]struct{})
	nextID := 0

	if cfg.EmbedTOC {
		var heads []string
		for _, s := range secs {
			if s.Heading != "" {
				heads = append(heads, s.Heading)
			}
		}
		toc := strings.TrimSpace(strings.Join(heads, "\n"))
		if toc != "" {
			hash := HashString(toc)
			if _, ok := seen[hash]; !ok {
				chunks = append(chunks, Chunk{
					ChunkID: nextID,
					Text:    toc,
					Tokens:  len(tokenize(toc)),
					SHA256:  hash,
					Meta:    map[string]any{"type": "toc"},
				})
				seen[hash] = struct{}{}
				nextID++
			}
		}
	}

	for _, sec := range secs {
		if cfg.EmbedHeadings && sec.Heading != "" {
			head := strings.TrimSpace(sec.Heading)
			hash := HashString(head)
			if _, ok := seen[hash]; !ok {
				chunks = append(chunks, Chunk{
					ChunkID: nextID,
					Text:    head,
					Tokens:  len(tokenize(head)),
					SHA256:  hash,
					Meta:    map[string]any{"type": "heading", "heading": sec.Heading},
				})
				seen[hash] = struct{}{}
				nextID++
			}
		}

		parts := []string{sec.Text}
		if cfg.ByParagraph {
			parts = splitParagraphs(sec.Text)
		}
		for _, part := range parts {
			tokens := tokenize(part)
			if len(tokens) == 0 {
				continue
			}
			sizes := append([]int{cfg.MaxTokens}, cfg.AdditionalMaxTokens...)
			sort.Ints(sizes)
			overlap := cfg.OverlapTokens
			if overlap < 0 {
				overlap = 0
			}
			for _, step := range sizes {
				if step <= 0 {
					step = 800
				}
				if len(tokens) <= step {
					text := strings.TrimSpace(part)
					hash := HashString(text)
					if _, ok := seen[hash]; ok {
						continue
					}
					chunks = append(chunks, Chunk{
						ChunkID: nextID,
						Text:    text,
						Tokens:  len(tokens),
						SHA256:  hash,
						Meta:    map[string]any{"heading": sec.Heading, "size": step, "summary": summarize(text)},
					})
					seen[hash] = struct{}{}
					nextID++
					continue
				}
				start := 0
				for start < len(tokens) {
					end := start + step
					if end > len(tokens) {
						end = len(tokens)
					}
					sub := strings.Join(tokens[start:end], " ")
					hash := HashString(sub)
					if _, ok := seen[hash]; !ok {
						chunks = append(chunks, Chunk{
							ChunkID: nextID,
							Text:    sub,
							Tokens:  end - start,
							SHA256:  hash,
							Meta:    map[string]any{"heading": sec.Heading, "size": step, "summary": summarize(sub)},
						})
						seen[hash] = struct{}{}
						nextID++
					}
					if end == len(tokens) {
						break
					}
					start = end - overlap
					if start < 0 {
						start = 0
					}
				}
			}
		}
	}
	return chunks, nil
}

func tokenize(s string) []string {
	if s == "" {
		return nil
	}
	return strings.Fields(s)
}

func splitParagraphs(s string) []string {
	parts := strings.Split(s, "\n\n")
	var res []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			res = append(res, p)
		}
	}
	return res
}

func summarize(s string) string {
	toks := tokenize(s)
	if len(toks) > 50 {
		toks = toks[:50]
	}
	return strings.Join(toks, " ")
}
