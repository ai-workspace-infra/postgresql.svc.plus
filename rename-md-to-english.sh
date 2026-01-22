#!/bin/bash
# rename-md-to-english.sh
# 将所有中文 Markdown 文件名改为英文并移动到 docs/

set -e

echo "📝 重命名 Markdown 文件并移动到 docs/"
echo "=========================================="
echo ""

# 确保 docs 目录存在
mkdir -p docs

# 根目录的中文文件 - 重命名并移动到 docs/
if [ -f "精简总结.md" ]; then
    echo "移动: 精简总结.md → docs/SUMMARY.md"
    mv "精简总结.md" "docs/SUMMARY.md"
fi

if [ -f "完成总结.md" ]; then
    echo "移动: 完成总结.md → docs/COMPLETION_REPORT.md"
    mv "完成总结.md" "docs/COMPLETION_REPORT.md"
fi

# 根目录的英文文件 - 移动到 docs/
if [ -f "PROJECT_STRUCTURE.md" ]; then
    echo "移动: PROJECT_STRUCTURE.md → docs/PROJECT_STRUCTURE.md"
    mv "PROJECT_STRUCTURE.md" "docs/PROJECT_STRUCTURE.md"
fi

if [ -f "QUICKSTART.md" ]; then
    echo "移动: QUICKSTART.md → docs/QUICKSTART.md"
    mv "QUICKSTART.md" "docs/QUICKSTART.md"
fi

# docs 目录的中文文件 - 重命名
if [ -f "docs/精简总结.md" ]; then
    echo "重命名: docs/精简总结.md → docs/SUMMARY.md"
    mv "docs/精简总结.md" "docs/SUMMARY.md"
fi

if [ -f "docs/完成总结.md" ]; then
    echo "重命名: docs/完成总结.md → docs/COMPLETION_REPORT.md"
    mv "docs/完成总结.md" "docs/COMPLETION_REPORT.md"
fi

# 移动旧的文档文件到 docs/ (如果存在)
for file in AGENTS.md IMPLEMENTATION_GUIDE.md PATH_VERIFICATION.md TOKEN_AUTH_MANUAL.md TOKEN_AUTH_SUMMARY.md; do
    if [ -f "$file" ]; then
        echo "移动: $file → docs/archive/$file"
        mkdir -p docs/archive
        mv "$file" "docs/archive/"
    fi
done

echo ""
echo "✅ 重命名和移动完成!"
echo ""
echo "docs/ 目录结构:"
tree docs/ -L 2 2>/dev/null || find docs/ -type f -name "*.md" | sort
