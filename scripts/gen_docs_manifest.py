#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate a documentation manifest for dl.svc.plus/docs.

The script scans the documentation tree (typically mounted at
``/data/update-server/docs``) and emits a single ``all.json`` file containing
metadata for every HTML/PDF pair that can be presented in the dashboard docs
portal.

It infers titles, categories, versions and presentation tags from the directory
structure and provides canonical URLs to the rendered assets. The resulting
JSON structure is a list of ``DocResource`` dictionaries that match the shape
consumed by the Next.js UI under ``dashboard/app/docs``.

Usage example::

    python3 scripts/gen_docs_manifest.py \
        --root /data/update-server/docs \
        --base-url-prefix https://dl.svc.plus/docs \
        --output /data/update-server/dl-index

The command is idempotent and safe to rerun. Hidden files/directories (prefixed
with ``.``) are ignored. Only ``.pdf`` and ``.html`` assets are considered for
listing.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple

SUPPORTED_EXTENSIONS = {".pdf", ".html"}


@dataclass
class DocEntry:
    slug: str
    title: str
    category: Optional[str]
    version: Optional[str]
    version_dir: Optional[str]
    version_slug: Optional[str]
    collection_dir: Optional[str]
    collection_slug: Optional[str]
    collection_label: Optional[str]
    language: Optional[str]
    description: str
    pdf_url: Optional[str]
    html_url: Optional[str]
    tags: Set[str]
    updated_ts: float
    path_segments: Sequence[str]

    def to_payload(self) -> Dict[str, object]:
        updated_at = iso8601(self.updated_ts) if self.updated_ts else None
        tags = sorted({t for t in self.tags if t})
        description = self.description
        if not description:
            description = build_default_description(
                self.title,
                self.category,
                self.version,
                self.version_dir,
                [fmt for fmt in ["PDF" if self.pdf_url else None, "HTML" if self.html_url else None] if fmt],
            )
        payload: Dict[str, object] = {
            "slug": self.slug,
            "title": self.title,
            "description": description,
        }
        if self.category:
            payload["category"] = self.category
        if self.version:
            payload["version"] = self.version
        if updated_at:
            payload["updatedAt"] = updated_at
        if self.collection_dir:
            payload["collection"] = self.collection_dir
        if self.collection_slug:
            payload["collectionSlug"] = self.collection_slug
        if self.collection_label:
            payload["collectionLabel"] = self.collection_label
        if self.pdf_url:
            payload["pdfUrl"] = self.pdf_url
        if self.html_url:
            payload["htmlUrl"] = self.html_url
        if self.language:
            payload["language"] = self.language
        if self.version_dir and (not self.version or self.version_dir != self.version.replace(" ", "-")):
            payload["variant"] = self.version_dir
        if self.version_slug:
            payload["versionSlug"] = self.version_slug
        if tags:
            payload["tags"] = tags
        if self.path_segments:
            payload["pathSegments"] = list(self.path_segments)
        return payload


def iso8601(ts: float) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def humanize_segment(segment: str) -> str:
    """Convert a path fragment into a presentation friendly label."""

    if not segment:
        return ""
    # Replace delimiters with spaces and split camelCase boundaries.
    cleaned = segment.replace("_", " ")
    cleaned = cleaned.replace("-", " ")
    cleaned = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def slugify(parts: Iterable[str]) -> str:
    tokens: List[str] = []
    for part in parts:
        cleaned = re.sub(r"[^A-Za-z0-9]+", "-", part)
        cleaned = cleaned.strip("-").lower()
        if cleaned:
            tokens.append(cleaned)
    return "-".join(tokens) or "doc"


def format_version_label(version_dir: Optional[str]) -> Optional[str]:
    if not version_dir:
        return None
    tokens = re.split(r"[-_]+", version_dir)
    if len(tokens) >= 2:
        return " ".join(tokens[:2])
    return humanize_segment(version_dir)


def build_version_slug(version_dir: Optional[str], version_label: Optional[str]) -> Optional[str]:
    """Generate a stable slug for the version route segment."""

    candidate = version_dir or version_label
    if not candidate:
        return None
    return slugify([candidate])


def detect_language(version_dir: Optional[str]) -> Optional[str]:
    if not version_dir:
        return None
    match = re.match(r"^([A-Z]{2,3})(?:-|$)", version_dir)
    if not match:
        return None
    token = match.group(1)
    if len(token) <= 3:
        return token
    return None


def build_default_description(
    title: str,
    category: Optional[str],
    version: Optional[str],
    version_dir: Optional[str],
    formats: Sequence[str],
) -> str:
    lead = title or "Documentation"
    if category:
        lead = f"{lead} — {category}"
    suffix_parts: List[str] = []
    if version:
        suffix_parts.append(f"edition {version}")
    elif version_dir:
        suffix_parts.append(f"edition {humanize_segment(version_dir)}")
    if version_dir and version_dir != humanize_segment(version_dir):
        suffix_parts.append(f"release {version_dir}")
    if formats:
        if len(formats) == 1:
            suffix_parts.append(f"available as {formats[0]}")
        else:
            suffix_parts.append(f"available as {' and '.join(formats)}")
    suffix = ", ".join(suffix_parts)
    if suffix:
        return f"{lead} ({suffix})."
    return f"{lead}."


def should_skip(path: Path) -> bool:
    return any(part.startswith(".") for part in path.parts)


def build_url(root: Path, file_path: Path, base_prefix: str) -> str:
    rel = file_path.relative_to(root).as_posix()
    # Ensure a single leading slash before appending to prefix.
    rel = "/" + rel.lstrip("/")
    prefix = base_prefix.rstrip("/")
    if prefix:
        return f"{prefix}{rel}"
    return rel


def create_entry(parts: Tuple[str, ...]) -> DocEntry:
    category = humanize_segment(parts[0]) if parts else None
    version_dir = parts[1] if len(parts) > 1 else None
    collection_dir = parts[0] if parts else None
    collection_slug = slugify(parts[:1]) if parts else None
    collection_label = humanize_segment(collection_dir or "") if collection_dir else None
    version_label = format_version_label(version_dir)
    version_slug = build_version_slug(version_dir, version_label)
    title = humanize_segment(parts[-1]) if parts else ""
    language = detect_language(version_dir)

    tags: Set[str] = set()
    if category:
        tags.add(category)
    if language:
        tags.add(language)
    if version_label:
        tags.add(version_label)

    return DocEntry(
        slug=slugify(parts),
        title=title or parts[-1],
        category=category,
        version=version_label,
        version_dir=version_dir,
        version_slug=version_slug,
        collection_dir=collection_dir,
        collection_slug=collection_slug,
        collection_label=collection_label,
        language=language,
        description="",
        pdf_url=None,
        html_url=None,
        tags=tags,
        updated_ts=0.0,
        path_segments=parts[:-1],
    )


def collect_docs(root: Path, base_prefix: str, include: List[str], quiet: bool = False) -> List[DocEntry]:
    entries: Dict[Tuple[str, ...], DocEntry] = {}

    # Auto-discover directories if include is not specified or only contains default
    if not include or include == ["docs"]:
        include = [d.name for d in root.iterdir() if d.is_dir() and not should_skip(d)]
        if not quiet:
            print(f"Auto-discovered directories: {', '.join(include)}")

    include_set = set(include)

    for file_path in root.rglob("*"):
        if not file_path.is_file():
            continue
        if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        rel = file_path.relative_to(root)
        if should_skip(rel):
            continue

        # Check if file is in an included directory
        if rel.parts and rel.parts[0] not in include_set:
            continue

        parts = rel.parts[:-1] + (file_path.stem,)
        if not parts:
            continue
        key = tuple(parts)
        entry = entries.get(key)
        if entry is None:
            entry = create_entry(key)
            entries[key] = entry

        url = build_url(root, file_path, base_prefix)
        if file_path.suffix.lower() == ".pdf":
            entry.pdf_url = url
        elif file_path.suffix.lower() == ".html":
            entry.html_url = url

        try:
            mtime = file_path.stat().st_mtime
        except FileNotFoundError:
            mtime = 0.0
        entry.updated_ts = max(entry.updated_ts, mtime)

    return sorted(entries.values(), key=lambda e: (-e.updated_ts, e.slug))


def write_manifest(output_path: Path, entries: Sequence[DocEntry]) -> None:
    payload = [entry.to_payload() for entry in entries]
    tmp_path = output_path.with_suffix(output_path.suffix + ".tmp")
    with tmp_path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    tmp_path.replace(output_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate documentation manifest (docs-manifest.json)")
    parser.add_argument("--root", required=True, help="Root directory of the docs tree (e.g. /data/update-server/docs)")
    parser.add_argument("--base-url-prefix", default="/docs", help="URL prefix to prepend to asset paths")
    parser.add_argument("--output", default="dl-index/", help="Output directory (default: dl-index/)")
    parser.add_argument("--quiet", action="store_true", help="Suppress progress output")
    parser.add_argument(
        "--include",
        default=["docs"],
        action="append",
        help="Directory names to include in the manifest. Can be provided multiple times. (default: docs)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Root path does not exist or is not a directory: {root}")

    entries = collect_docs(root, args.base_url_prefix, args.include, args.quiet)

    if not args.quiet:
        print(f"Discovered {len(entries)} documentation entries under {root}")

    # Handle output as either file or directory
    output_arg = Path(args.output)
    if output_arg.is_dir() or (not output_arg.exists() and str(output_arg).endswith('/')):
        # It's a directory - create the file inside it
        output_path = output_arg / "docs-manifest.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
    else:
        # It's a file - use as-is
        output_path = output_arg
        output_path.parent.mkdir(parents=True, exist_ok=True)

    write_manifest(output_path, entries)

    if not args.quiet:
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
