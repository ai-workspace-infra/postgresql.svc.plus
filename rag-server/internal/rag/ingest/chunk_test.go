package ingest

import (
	"strings"
	"testing"

	cfgpkg "rag-server/internal/rag/config"
)

func TestBuildChunksHeading(t *testing.T) {
	secs := []Section{{Heading: "h", Text: "a b c"}}
	cfg := cfgpkg.ChunkingCfg{MaxTokens: 10, OverlapTokens: 2}
	chunks, err := BuildChunks(secs, cfg)
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	if len(chunks) != 1 {
		t.Fatalf("expected 1 chunk, got %d", len(chunks))
	}
	if chunks[0].Meta["heading"].(string) != "h" {
		t.Fatalf("heading mismatch")
	}
}

func TestBuildChunksSlidingWindow(t *testing.T) {
	text := "one two three four five six seven eight nine ten"
	secs := []Section{{Heading: "h", Text: text}}
	cfg := cfgpkg.ChunkingCfg{MaxTokens: 4, OverlapTokens: 1}
	chunks, err := BuildChunks(secs, cfg)
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	if len(chunks) != 3 {
		t.Fatalf("expected 3 chunks, got %d", len(chunks))
	}
}

func TestBuildChunksOverlap(t *testing.T) {
	text := "a b c d e f"
	secs := []Section{{Heading: "h", Text: text}}
	cfg := cfgpkg.ChunkingCfg{MaxTokens: 3, OverlapTokens: 1}
	chunks, err := BuildChunks(secs, cfg)
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	if len(chunks) != 3 {
		t.Fatalf("expected 3 chunks, got %d", len(chunks))
	}
	if !strings.Contains(chunks[1].Text, "c") {
		t.Fatalf("expected overlap token in second chunk")
	}
}

func TestBuildChunksByParagraph(t *testing.T) {
	text := "a b\n\nc d"
	secs := []Section{{Heading: "h", Text: text}}
	cfg := cfgpkg.ChunkingCfg{MaxTokens: 10, ByParagraph: true}
	chunks, err := BuildChunks(secs, cfg)
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	if len(chunks) != 2 {
		t.Fatalf("expected 2 chunks, got %d", len(chunks))
	}
}

func TestBuildChunksEmbedStructures(t *testing.T) {
	secs := []Section{{Heading: "h1", Text: "a"}, {Heading: "h2", Text: "b"}}
	cfg := cfgpkg.ChunkingCfg{MaxTokens: 10, EmbedTOC: true, EmbedHeadings: true}
	chunks, err := BuildChunks(secs, cfg)
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	if len(chunks) != 5 {
		t.Fatalf("expected 5 chunks, got %d", len(chunks))
	}
	if chunks[0].Meta["type"] != "toc" {
		t.Fatalf("first chunk should be toc")
	}
}

func TestBuildChunksMultiSizes(t *testing.T) {
	text := "one two three four five"
	secs := []Section{{Heading: "h", Text: text}}
	cfg := cfgpkg.ChunkingCfg{MaxTokens: 5, AdditionalMaxTokens: []int{3}}
	chunks, err := BuildChunks(secs, cfg)
	if err != nil {
		t.Fatalf("build: %v", err)
	}
	if len(chunks) != 3 {
		t.Fatalf("expected 3 chunks, got %d", len(chunks))
	}
	sizes := map[int]bool{}
	for _, ch := range chunks {
		if v, ok := ch.Meta["size"]; ok {
			sizes[v.(int)] = true
		}
	}
	if !sizes[5] || !sizes[3] {
		t.Fatalf("sizes not recorded: %v", sizes)
	}
}
