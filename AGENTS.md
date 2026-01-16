# Agent Guidelines for postgresql.svc.plus

## Repository scope
These instructions apply to the entire repository. Add a more specific `AGENTS.md`
inside a subdirectory only when you need to override or augment the guidance below for
that subtree.

## Project overview
This repository hosts deployment assets and supporting utilities for XControl, with a
focus on PostgreSQL service configuration. It includes:
- Deployment manifests (`deploy/`, `example/`, `workflows/`) for Docker Compose,
  OpenResty/Nginx, Helm, and Ansible.
- Operational scripts in `scripts/` plus test harnesses in `tests/`.
- Documentation and runbooks under `docs/`.
- A small Rust/WASM module in `wasm/` and static dashboard assets in `ui/`.

## General expectations
- Match the existing language of the file (English vs. Chinese or bilingual) and retain
  the bilingual structure when you touch documentation that already mixes both.
- Keep configuration files and generated assets deterministic. If you edit files under
  `deploy/`, `docs/`, or `scripts/`, mention any required regeneration steps in your
  commit message or PR description.
- Avoid running or modifying destructive scripts (e.g., cleanup or prune scripts)
  without explicit user direction.

## Scripts and tooling
- Preserve shebangs and execution flags for shell scripts; keep scripts idempotent when
  possible.
- For TypeScript/JavaScript in `scripts/` or `types/`, retain the existing style and
  avoid introducing new runtime dependencies unless asked.
- For Python utilities, keep dependencies minimal and document any new requirements.

## Rust/WASM (`wasm/`)
- Format Rust code with `cargo fmt` when you touch `wasm/askai_limiter`.

## Documentation and Markdown (`docs/`, `README.md`, etc.)
- Wrap prose at a reasonable width (~100 characters) and preserve existing heading
  hierarchies.
- When documenting commands or configuration, prefer fenced code blocks with explicit
  language identifiers (e.g., `bash`, `yaml`, `json`).
- Update cross-references if you rename or relocate files that are linked in the docs.

## Testing summary
Before shipping changes, run the narrowest applicable subset of these commands:
- `./tests/build_test.sh`
- `./tests/dry_run_test.sh`
- `./tests/local_test.sh`
