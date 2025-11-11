#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Quick wrapper for gen_offline-package_manifest.py with smart defaults.

This script provides a simpler interface where you only need to specify
the output path, and it automatically uses sensible defaults.

Usage:
    python3 scripts/gen_offline-package_manifest_quick.py /path/to/update-server/dl-index

Equivalent to:
    python3 scripts/gen_offline-package_manifest.py \
        --root /path/to/update-server \
        --include offline-package \
        --output /path/to/update-server/dl-index
"""

import subprocess
import sys
from pathlib import Path


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/gen_offline-package_manifest_quick.py <output-dir>")
        print("\nExample:")
        print("  python3 scripts/gen_offline-package_manifest_quick.py /data/update-server/dl-index")
        print("\nThis will:")
        print("  - Use --root: /data/update-server")
        print("  - Use --include: offline-package")
        print("  - Create artifacts-manifest.json and offline-package.json in the output directory")
        sys.exit(1)

    output_dir = sys.argv[1]
    output_path = Path(output_dir).resolve()

    # Auto-derive root from output directory
    # If output is /data/update-server/dl-index, root should be /data/update-server
    root = output_path.parent

    # Run the actual script with defaults
    cmd = [
        "python3",
        "/Users/shenlan/workspaces/XControl/scripts/gen_offline-package_manifest.py",
        "--root", str(root),
        "--include", "offline-package",
        "--output", str(output_path)
    ]

    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)

    if result.returncode == 0:
        print(f"\n✅ Success! Created files:")
        artifacts = output_path / "artifacts-manifest.json"
        offline = output_path / "offline-package.json"
        if artifacts.exists():
            print(f"  - {artifacts}")
        if offline.exists():
            print(f"  - {offline}")

    sys.exit(result.returncode)


if __name__ == "__main__":
    main()