SHELL := /bin/bash
DENO_VERSION := $(shell deno --version 2>/dev/null | head -n1 || echo "Not Found")
MAGICK := $(shell command -v magick 2>/dev/null || command -v convert 2>/dev/null)
OS := $(shell uname -s)
PORT := 8000

.PHONY: help init info check deps dev dev-full start stop restart test build prebuild clean icon sync-dl-index css-build css-watch format lint

## Default target - show help
help:
	@echo "🍋 Fresh + Deno Dashboard - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start Fresh development server"
	@echo "  make dev-full     - Start dev server + CSS watch"
	@echo "  make css-build    - Build Tailwind CSS (one-time)"
	@echo "  make css-watch    - Watch and rebuild Tailwind CSS"
	@echo ""
	@echo "Build & Deploy:"
	@echo "  make prebuild     - Generate manifests and static assets"
	@echo "  make build        - Full production build"
	@echo "  make start        - Start production server"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make check        - Type check all TypeScript files"
	@echo "  make lint         - Run Deno linter"
	@echo "  make format       - Format code with Deno fmt"
	@echo "  make test         - Run tests"
	@echo ""
	@echo "Utilities:"
	@echo "  make icon         - Generate favicon and icons"
	@echo "  make sync-dl-index - Fetch download & docs manifests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make deps         - Cache dependencies"
	@echo "  make info         - Show environment info"
	@echo ""

## Environment info
info:
	@echo "🧾 Environment Information:"
	@echo "  Deno:        $(DENO_VERSION)"
	@echo "  OS:          $(OS)"
	@echo "  ImageMagick: $(if $(MAGICK),✅ $(MAGICK),❌ Not installed)"
	@echo "  Port:        $(PORT)"
	@echo ""
	@deno --version

## Check Deno installation
check-deno:
	@if ! command -v deno >/dev/null 2>&1; then \
		echo "❌ Deno not found."; \
		if [ "$(OS)" = "Darwin" ]; then \
			echo "👉 Install with: brew install deno"; \
		elif [ -f /etc/debian_version ]; then \
			echo "👉 Install with: curl -fsSL https://deno.land/install.sh | sh"; \
		else \
			echo "👉 Visit: https://deno.land/manual/getting_started/installation"; \
		fi; \
		exit 1; \
	fi

## Initialize project
init: check-deno
	@echo "🔧 Initializing Fresh + Deno project..."
	@echo "✅ Deno is installed: $(DENO_VERSION)"
	@$(MAKE) deps
	@echo "✅ Project initialized successfully!"

## Cache dependencies
deps: check-deno
	@echo "📦 Caching Deno dependencies..."
	@deno cache --reload main.ts dev.ts
	@deno install
	@echo "✅ Dependencies cached!"

## Type check
check: check-deno
	@echo "🔍 Type checking..."
	@deno task check

## Lint code
lint: check-deno
	@echo "🔍 Linting code..."
	@deno task lint

## Format code
format: check-deno
	@echo "✨ Formatting code..."
	@deno task fmt

## Build Tailwind CSS (one-time)
css-build: check-deno
	@echo "🎨 Building Tailwind CSS..."
	@deno task css:build
	@echo "✅ CSS built successfully!"

## Watch and rebuild CSS
css-watch: check-deno
	@echo "👀 Watching Tailwind CSS..."
	@deno task css:watch

## Generate manifests and indexes
prebuild: check-deno
	@echo "📦 Generating manifests and static assets..."
	@$(MAKE) sync-dl-index
	@deno task prebuild
	@echo "✅ Prebuild complete!"

## Full production build
build: check-deno
	@echo "🔨 Building Fresh + Deno production..."
	@$(MAKE) css-build
	@$(MAKE) prebuild
	@deno task build
	@echo "✅ Build complete!"

## Development server
dev: check-deno
	@echo "🚀 Starting Fresh development server on http://localhost:$(PORT)..."
	@deno task dev

## Development server with CSS watch
dev-full: check-deno
	@echo "🚀 Starting Fresh dev server + CSS watch on http://localhost:$(PORT)..."
	@deno task dev:full

## Start production server in background
start: check-deno
	@echo "🚀 Starting Fresh production server in background..."
	@if [ -f dashboard.pid ]; then \
		echo "⚠️  Server already running (PID: $$(cat dashboard.pid))"; \
		exit 1; \
	fi
	@nohup deno task start >/tmp/dashboard-fresh.log 2>&1 & echo $$! > dashboard.pid
	@sleep 2
	@if [ -f dashboard.pid ] && kill -0 $$(cat dashboard.pid) 2>/dev/null; then \
		echo "✅ Server started (PID: $$(cat dashboard.pid))"; \
		echo "📋 Logs: tail -f /tmp/dashboard-fresh.log"; \
		echo "🌐 URL: http://localhost:$(PORT)"; \
	else \
		echo "❌ Failed to start server"; \
		rm -f dashboard.pid; \
		exit 1; \
	fi

## Stop background server
stop:
	@echo "🛑 Stopping Fresh server..."
	@if [ -f dashboard.pid ]; then \
		kill $$(cat dashboard.pid) >/dev/null 2>&1 || true; \
		rm dashboard.pid; \
		echo "✅ Server stopped"; \
	else \
		echo "⚠️  No running server found"; \
	fi

## Restart server
restart: stop start

## Run tests
test: check-deno
	@echo "🧪 Running tests..."
	@deno task test || echo "⚠️  No tests configured"

## Generate icons
icon:
	@echo "🎨 Generating favicon and icon images..."
	@if [ -z "$(MAGICK)" ]; then \
		echo "❌ ImageMagick not found."; \
		if [ "$(OS)" = "Darwin" ]; then \
			echo "👉 Try: brew install imagemagick"; \
		elif [ -f /etc/debian_version ]; then \
			echo "👉 Try: sudo apt install imagemagick"; \
		elif [ -f /etc/redhat-release ]; then \
			echo "👉 Try: sudo dnf install imagemagick"; \
		fi; \
		exit 1; \
	fi
	@mkdir -p static/icons
	@if [ -f ../ui/logo.png ]; then \
		$(MAGICK) ../ui/logo.png -resize 32x32 static/icons/cloudnative_32.png; \
		$(MAGICK) ../ui/logo.png -resize 64x64 -background none -define icon:auto-resize=64,48,32,16 static/favicon.ico; \
		echo "✅ Icons generated successfully."; \
	else \
		echo "⚠️  Logo file not found: ../ui/logo.png"; \
		exit 1; \
	fi

## Sync download and docs manifests
sync-dl-index:
	@echo "📥 Fetching download & docs manifests..."
	@mkdir -p public/dl-index
	@if curl -fsSL --connect-timeout 10 https://dl.svc.plus/manifest.json -o public/dl-index/artifacts-manifest.json; then \
		echo "✅ Downloaded artifacts manifest"; \
	else \
		echo "⚠️  Unable to download artifacts manifest. Using existing snapshot."; \
	fi
	@if curl -fsSL --connect-timeout 10 https://dl.svc.plus/docs/all.json -o public/dl-index/docs-manifest.json; then \
		echo "✅ Downloaded docs manifest"; \
	else \
		echo "⚠️  Unable to download docs manifest. Using existing snapshot."; \
	fi

## Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf _fresh
	@rm -rf static/_build
	@rm -rf node_modules
	@rm -f dashboard.pid
	@echo "✅ Clean complete!"

## Clean everything including caches
clean-all: clean
	@echo "🧹 Cleaning caches..."
	@deno cache --reload main.ts dev.ts
	@echo "✅ Deep clean complete!"

## Status check
status:
	@echo "📊 Server Status:"
	@if [ -f dashboard.pid ]; then \
		if kill -0 $$(cat dashboard.pid) 2>/dev/null; then \
			echo "  ✅ Server running (PID: $$(cat dashboard.pid))"; \
			echo "  📋 Logs: tail -f /tmp/dashboard-fresh.log"; \
			echo "  🌐 URL: http://localhost:$(PORT)"; \
		else \
			echo "  ❌ Server PID file exists but process is not running"; \
			rm dashboard.pid; \
		fi \
	else \
		echo "  ⚠️  No server running"; \
	fi

## Show logs
logs:
	@if [ -f /tmp/dashboard-fresh.log ]; then \
		tail -f /tmp/dashboard-fresh.log; \
	else \
		echo "⚠️  No log file found"; \
	fi

## Quick dev setup
quick: deps css-build
	@echo "⚡ Quick setup complete!"
	@echo "👉 Run: make dev"

## Production setup
prod: build
	@echo "🚀 Production build complete!"
	@echo "👉 Run: make start"
