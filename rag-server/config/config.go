package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

// Log defines logging configuration for the server.
type Log struct {
	// Level sets the minimum log level. Valid values are "debug", "info",
	// "warn", and "error".
	Level string `yaml:"level"`
}

type Redis struct {
	Addr     string `yaml:"addr"`
	Password string `yaml:"password"`
}

type VectorDB struct {
	PGURL      string `yaml:"pgurl"`
	PGHost     string `yaml:"pg_host"`
	PGPort     int    `yaml:"pg_port"`
	PGUser     string `yaml:"pg_user"`
	PGPassword string `yaml:"pg_password"`
	PGDBName   string `yaml:"pg_db_name"`
	PGSSLMode  string `yaml:"pg_sslmode"`
}

func (v VectorDB) DSN() string {
	if v.PGURL != "" {
		return v.PGURL
	}
	if v.PGHost == "" || v.PGUser == "" || v.PGDBName == "" {
		return ""
	}
	port := v.PGPort
	if port == 0 {
		port = 5432
	}
	ssl := v.PGSSLMode
	if ssl == "" {
		ssl = "require"
	}
	return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s", v.PGUser, v.PGPassword, v.PGHost, port, v.PGDBName, ssl)
}

type Datasource struct {
	Name string `yaml:"name"`
	Repo string `yaml:"repo"`
	Path string `yaml:"path"`
}

type Global struct {
	Redis       Redis        `yaml:"redis"`
	VectorDB    VectorDB     `yaml:"vectordb"`
	Datasources []Datasource `yaml:"datasources"`
	Proxy       string       `yaml:"proxy"`
}

type Sync struct {
	Repo struct {
		Proxy string `yaml:"proxy"`
	} `yaml:"repo"`
}

// StringSlice supports unmarshaling from either a single string or a list of strings.
type StringSlice []string

// UnmarshalYAML implements yaml unmarshalling for StringSlice.
func (s *StringSlice) UnmarshalYAML(value *yaml.Node) error {
	switch value.Kind {
	case yaml.ScalarNode:
		var str string
		if err := value.Decode(&str); err != nil {
			return err
		}
		*s = []string{str}
	case yaml.SequenceNode:
		var arr []string
		if err := value.Decode(&arr); err != nil {
			return err
		}
		*s = arr
	default:
		return fmt.Errorf("invalid yaml kind for StringSlice: %v", value.Kind)
	}
	return nil
}

type ModelCfg struct {
	Provider string      `yaml:"provider"`
	Models   StringSlice `yaml:"models"`
	BaseURL  string      `yaml:"baseurl"`
	Endpoint string      `yaml:"endpoint"`
	Token    string      `yaml:"token"`
}

type EmbeddingCfg struct {
	MaxBatch     int `yaml:"max_batch"`
	Dimension    int `yaml:"dimension"`
	MaxChars     int `yaml:"max_chars"`
	RateLimitTPM int `yaml:"rate_limit_tpm"`
}

type ChunkingCfg struct {
	MaxTokens          int      `yaml:"max_tokens"`
	OverlapTokens      int      `yaml:"overlap_tokens"`
	PreferHeadingSplit bool     `yaml:"prefer_heading_split"`
	IncludeExts        []string `yaml:"include_exts"`
	IgnoreDirs         []string `yaml:"ignore_dirs"`
}

type API struct {
	AskAI struct {
		Timeout int `yaml:"timeout"`
		Retries int `yaml:"retries"`
	} `yaml:"askai"`
}

// Duration is a thin wrapper around time.Duration to support YAML unmarshalling
// from strings like "15s".
type Duration struct {
	time.Duration
}

// UnmarshalYAML implements yaml unmarshalling for Duration values.
func (d *Duration) UnmarshalYAML(value *yaml.Node) error {
	var raw string
	if err := value.Decode(&raw); err != nil {
		return err
	}
	if raw == "" {
		d.Duration = 0
		return nil
	}
	parsed, err := time.ParseDuration(raw)
	if err != nil {
		return err
	}
	d.Duration = parsed
	return nil
}

// String returns the duration formatted using time.Duration's String method.
func (d Duration) String() string {
	return d.Duration.String()
}

// ServerCfg contains HTTP server runtime configuration.
type ServerCfg struct {
	Addr           string   `yaml:"addr"`
	ReadTimeout    Duration `yaml:"readTimeout"`
	WriteTimeout   Duration `yaml:"writeTimeout"`
	PublicURL      string   `yaml:"publicUrl"`
	AllowedOrigins []string `yaml:"allowedOrigins"`
}

type AuthCfg struct {
	Enable      bool   `yaml:"enable"`
	AuthURL     string `yaml:"authUrl"`
	APIBaseURL  string `yaml:"apiBaseUrl"`
	PublicToken string `yaml:"publicToken"`
}

type Config struct {
	Log    Log    `yaml:"log"`
	Global Global `yaml:"global"`
	Sync   Sync   `yaml:"sync"`
	Auth   AuthCfg `yaml:"auth"`
	Models struct {
		Embedder  ModelCfg `yaml:"embedder"`
		Generator ModelCfg `yaml:"generator"`
	} `yaml:"models"`
	Embedding EmbeddingCfg `yaml:"embedding"`
	Chunking  ChunkingCfg  `yaml:"chunking"`
	API       API          `yaml:"api"`
	Server    ServerCfg    `yaml:"server"`
}

// Load reads the configuration file at the provided path. When path is empty,
// it defaults to rag-server/config/server.yaml.
func Load(path ...string) (*Config, error) {
	p := filepath.Join("rag-server", "config", "server.yaml")
	if len(path) > 0 && path[0] != "" {
		p = path[0]
	}
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, err
	}
	var cfg Config
	if err := yaml.Unmarshal(b, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
