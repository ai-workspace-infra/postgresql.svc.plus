# Agent Guidelines for XControl

## Repository scope
These instructions apply to the entire repository. Create a more specific `AGENTS.md`
inside a subdirectory only when you need to override or augment the guidance below for
that subtree.

## Project overview
XControl is a polyglot monorepo that ships:
- Multiple Go services (API server, account service, RAG server, supporting CLIs) under
the top-level Go module `xcontrol`.
- A Next.js dashboard (`dashboard/`) implemented in TypeScript with Tailwind CSS and
Vitest/Playwright tests.
- CMS configuration, SQL migrations, deployment manifests, and documentation that are
consumed by the services and UI.

## General expectations
- Match the existing language of the file (English vs. Chinese or bilingual) and retain
the bilingual structure when you touch documentation that already mixes both.
- Prefer structured logging (`log/slog`) or existing helper utilities over raw
`fmt.Println` in Go code.
- Keep configuration files and generated assets deterministic. If you edit files under
`config/`, `docs/cms/`, or `scripts/`, mention any required regeneration steps in your
commit message or PR description.

## Go code (all directories except `dashboard/`)
- Format Go code with `gofmt` (or `go fmt ./...`) before committing.
- Organize imports using `goimports` if available; otherwise maintain the existing
standard library / third-party separation.
- Run `go test ./...` from the repository root (or a narrower package path) after
changing Go files. Use `make test` in submodules such as `rag-server/` when you need the
module-specific workflow.
- Keep configuration structs in sync with their YAML/JSON sources and update default
values when you add new fields.

## TypeScript / Next.js dashboard (`dashboard/`)
- Use `yarn` (not `npm` or `pnpm`). Install dependencies with `yarn install` and run
scripts with `yarn --cwd dashboard <script>`.
- Format code with the existing ESLint rules by running `yarn --cwd dashboard lint
--fix` when possible. Follow the 2-space indentation style and single-quote string
literals you see in the current codebase.
- Run `yarn --cwd dashboard lint` and the relevant tests (`yarn --cwd dashboard test`
and/or `yarn --cwd dashboard test:e2e`) when you touch dashboard code.
- Avoid introducing runtime-only environment variables; prefer adding entries to
`dashboard/config/runtime-service-config.yaml` so that environments stay declarative.

## Documentation and Markdown (`docs/`, `README.md`, etc.)
- Wrap prose at a reasonable width (~100 characters) and preserve existing heading
hierarchies.
- When documenting commands or configuration, prefer fenced code blocks with explicit
language identifiers (e.g., `bash`, `go`, `json`).
- Update cross-references if you rename or relocate files that are linked in the docs.

## Database and migrations
- For schema changes, update both the SQL migration under the relevant `sql/` directory
and any Go structs/DTOs that map to the same tables.
- Provide idempotent migration steps where possible and document required manual steps
in the accompanying README or commit message.

## Testing summary
Before shipping changes, run the narrowest applicable subset of these commands:
- `go test ./...` (Go services)
- `yarn --cwd dashboard lint`
- `yarn --cwd dashboard test`
- `yarn --cwd dashboard test:e2e` (when you modify Playwright specs or end-to-end flows)
