SHELL := /bin/bash
NODE_VERSION := $(shell node -v 2>/dev/null || echo "Not Found")
YARN := $(shell command -v yarn 2>/dev/null)
MAGICK := $(shell command -v magick 2>/dev/null || command -v convert 2>/dev/null)
OS := $(shell uname -s)
YARN_VERSION ?= 4.12.0

.PHONY: init ensure-deps dev build export clean info icon start stop restart test sync-dl-index

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
	@mkdir -p public/icons
	@$(MAGICK) ../ui/logo.png -resize 32x32 public/icons/cloudnative_32.png
	@$(MAGICK) ../ui/logo.png -resize 64x64 -background none -define icon:auto-resize=64,48,32,16 public/favicon.ico
	@echo "✅ Icons generated successfully."

init:
        @echo "🔧 Installing dependencies for dashboard..."
        @corepack enable && corepack prepare yarn@$(YARN_VERSION) --activate
        @if [ -z "$(YARN)" ]; then \
                echo "⚠️  Yarn not found. Attempting to install..."; \
                if [ "$(OS)" = "Darwin" ]; then \
                        if command -v brew >/dev/null 2>&1; then \
                                brew install yarn; \
			else \
				echo "❌ Homebrew not found. Please install Yarn manually."; exit 1; \
			fi; \
		elif [ -f /etc/debian_version ]; then \
			curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add - && \
			echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list && \
			sudo apt update && sudo apt install -y yarn; \
		elif [ -f /etc/redhat-release ]; then \
			curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo && \
			sudo yum install -y yarn; \
		else \
                        echo "❌ Unsupported OS. Please install Yarn manually."; exit 1; \
                fi; \
        fi
        yarn config set npmRegistryServer https://registry.npmmirror.com
        yarn install --immutable

ensure-deps:
        @if [ ! -f .yarn/install-state.gz ] || [ ! -d node_modules ] || [ ! -d node_modules/sanitize-html ]; then \
                echo "📦 Installing dependencies..."; \
                yarn install --immutable; \
        fi

dev: ensure-deps
	@echo "🚀 Starting Next.js dev server (dashboard)..."
	yarn dev -p 3001

start:
	@echo "🚀 Starting Next.js dev server (dashboard) in background..."
	@nohup yarn dev -p 3001 >/tmp/dashboard.log 2>&1 & echo $$! > dashboard.pid

stop:
	@echo "🛑 Stopping Next.js dev server (dashboard)..."
	@if [ -f dashboard.pid ]; then \
	        kill `cat dashboard.pid` >/dev/null 2>&1 || true; \
	        rm dashboard.pid; \
	else \
	        echo "No running server"; \
	fi

restart: stop start

test:
	@echo "🔍 Running tests..."
	@yarn test || echo "No tests configured"

build: init
        yarn config set npmRegistryServer https://registry.npmmirror.com
        @if [ -z "$(SKIP_SYNC)" ]; then \
                $(MAKE) sync-dl-index; \
                fi
	@echo "🔨 Building dashboard..."
	yarn next build

sync-dl-index:
	@echo "📥 Fetching download & docs manifests..."
	@mkdir -p public/dl-index
	@if ! curl -fsSL https://dl.svc.plus/manifest.json -o public/dl-index/artifacts-manifest.json; then \
            echo "⚠️  Unable to download artifacts manifest. Using existing snapshot."; \
			fi
	@if ! curl -fsSL https://dl.svc.plus/docs/all.json -o public/dl-index/docs-manifest.json; then \
            echo "⚠️  Unable to download docs manifest. Using existing snapshot."; \
    fi

export:
	@echo "📦 Exporting dashboard static site to ./out ..."
	@NEXT_SHOULD_EXPORT=true yarn next export

clean:
	@echo "🧹 Cleaning .next and out directories..."
	rm -rf .next out

info:
	@echo "🧾 Node.js version: $(NODE_VERSION)"

