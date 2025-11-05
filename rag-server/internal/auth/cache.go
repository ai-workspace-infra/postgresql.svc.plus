package auth

import (
	"sync"
	"time"
)

// CacheEntry 缓存条目
type CacheEntry struct {
	Value     *TokenVerifyResponse
	ExpiresAt time.Time
}

// TokenCache Token 验证结果缓存
type TokenCache struct {
	mu        sync.RWMutex
	cache     map[string]*CacheEntry
	gcInterval time.Duration
	ttl       time.Duration
	quit      chan struct{}
}

// Config 缓存配置
type CacheConfig struct {
	TTL          time.Duration // 默认 60s
	GCInterval   time.Duration // 垃圾回收间隔，默认 5m
	InitialSize  int           // 初始容量，默认 100
}

// DefaultCacheConfig 返回默认缓存配置
func DefaultCacheConfig() *CacheConfig {
	return &CacheConfig{
		TTL:         60 * time.Second,
		GCInterval:  5 * time.Minute,
		InitialSize: 100,
	}
}

// NewTokenCache 创建新的 Token 缓存
func NewTokenCache(cfg *CacheConfig) *TokenCache {
	if cfg == nil {
		cfg = DefaultCacheConfig()
	}

	if cfg.TTL == 0 {
		cfg.TTL = 60 * time.Second
	}

	if cfg.GCInterval == 0 {
		cfg.GCInterval = 5 * time.Minute
	}

	if cfg.InitialSize == 0 {
		cfg.InitialSize = 100
	}

	cache := &TokenCache{
		cache:     make(map[string]*CacheEntry, cfg.InitialSize),
		gcInterval: cfg.GCInterval,
		ttl:       cfg.TTL,
		quit:      make(chan struct{}),
	}

	// 启动后台 GC 任务
	go cache.gcWorker()

	return cache
}

// Get 获取缓存的验证结果
func (c *TokenCache) Get(token string) (*TokenVerifyResponse, bool) {
	c.mu.RLock()
	entry, exists := c.cache[token]
	c.mu.RUnlock()

	if !exists {
		return nil, false
	}

	// 检查是否过期
	if time.Now().After(entry.ExpiresAt) {
		// 异步删除过期条目
		go c.Delete(token)
		return nil, false
	}

	return entry.Value, true
}

// Set 设置缓存
func (c *TokenCache) Set(token string, value *TokenVerifyResponse) {
	c.mu.Lock()
	c.cache[token] = &CacheEntry{
		Value:     value,
		ExpiresAt: time.Now().Add(c.ttl),
	}
	c.mu.Unlock()
}

// Delete 删除缓存
func (c *TokenCache) Delete(token string) {
	c.mu.Lock()
	delete(c.cache, token)
	c.mu.Unlock()
}

// Clear 清空缓存
func (c *TokenCache) Clear() {
	c.mu.Lock()
	for key := range c.cache {
		delete(c.cache, key)
	}
	c.mu.Unlock()
}

// Size 返回缓存大小
func (c *TokenCache) Size() int {
	c.mu.RLock()
	size := len(c.cache)
	c.mu.RUnlock()
	return size
}

// Stop 停止缓存清理任务
func (c *TokenCache) Stop() {
	close(c.quit)
}

// gcWorker 后台垃圾回收工作协程
func (c *TokenCache) gcWorker() {
	ticker := time.NewTicker(c.gcInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.gc()
		case <-c.quit:
			return
		}
	}
}

// gc 清理过期缓存
func (c *TokenCache) gc() {
	now := time.Now()

	c.mu.Lock()
	for token, entry := range c.cache {
		if now.After(entry.ExpiresAt) {
			delete(c.cache, token)
		}
	}
	c.mu.Unlock()
}

// Stats 缓存统计信息
type CacheStats struct {
	Size         int           `json:"size"`
	TTL          time.Duration `json:"ttl"`
	GCInterval   time.Duration `json:"gc_interval"`
	HitCount     int64         `json:"hit_count"`
	MissCount    int64         `json:"miss_count"`
	EvictionCount int64        `json:"eviction_count"`
}

// Stats 返回缓存统计信息
func (c *TokenCache) Stats() CacheStats {
	return CacheStats{
		Size:       c.Size(),
		TTL:        c.ttl,
		GCInterval: c.gcInterval,
	}
}
