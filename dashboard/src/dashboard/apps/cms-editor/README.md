# CMS Editor integration layer

This directory wraps the vendored NeuraPress editor so the dashboard can provide routing, branding, and storage policies.

- `EditorShell.tsx` renders the shared UI for both public and dashboard routes.
- `storage/local.ts` implements the local-only draft store used for unauthenticated visitors.
- `storage/remote.ts` is a placeholder for the future SaaS-backed draft service.

## Storage adapter contract

All storage implementations must satisfy the `DraftStore` interface defined in `storage/index.ts`:

- `list()` → array of draft metadata for navigation
- `load(id)` → fetches full content for the draft
- `save({ id?, title, content })` → persists and returns the draft id
- `remove(id)` → deletes a draft

The public `/editor` route should default to `localDraftStore` and remain usable without authentication. Dashboard routes may switch to `remoteDraftStore` when SaaS features are available; the shell supports falling back to local storage while keeping the editor logic intact.
