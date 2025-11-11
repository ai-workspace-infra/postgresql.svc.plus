# Blog Content Directory

This directory contains all blog posts for the Cloud-Neutral platform.

## Directory Structure

```
src/content/blog/
├── README.md          # This file
├── first-post.md      # Example blog post
└── ...
```

## Adding a New Blog Post

1. Create a new markdown file in this directory
2. Use the following format:

```markdown
---
title: Your Post Title
author: Author Name
date: 2025-01-01
tags: [tag1, tag2, tag3]
excerpt: Brief description of the post
---

Your post content here in Markdown format.
```

## File Naming Convention

- Use kebab-case: `my-first-post.md`
- Avoid spaces and special characters
- Include the `.md` extension

## Metadata Fields

- **title**: The post title (required)
- **author**: Author name (optional)
- **date**: Publication date in YYYY-MM-DD format (required)
- **tags**: Array of tags (optional)
- **excerpt**: Brief description (optional, auto-generated if not provided)

