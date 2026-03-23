# Prompt Context Mentions

Type `@` in any Markdown file to instantly reference project files by name — perfect for writing AI prompts that need precise file context.

![Demo](static/demo.gif)

## Why

When crafting prompts for AI coding assistants, you often need to reference specific files. Instead of typing paths by hand, just type `@` and get instant autocomplete for any file in your project.

Works great with:
- `CLAUDE.md`, `AGENTS.md`, or any prompt file in your repo
- Technical documentation that links to source files
- AI-assisted workflows where file context matters

## Features

- `@` trigger in Markdown files with fuzzy file search
- Instant suggestions — cache pre-warmed on startup
- Configurable base paths, allowed extensions, and exclude patterns

## Configuration

| Setting | Default | Description |
|---|---|---|
| `contextMentions.basePaths` | `["src"]` | Folders to search for files |
| `contextMentions.relativeDirectory` | `"src"` | Root for computing relative paths shown in suggestions |
| `contextMentions.allowedExtensions` | `.ts .js .tsx .jsx .json` | File types to include |
| `contextMentions.maxSuggestions` | `50` | Max results shown |
| `contextMentions.excludeGlobs` | `node_modules, dist, build...` | Patterns to ignore |

## Usage

1. Open any `.md` file
2. Type `@` followed by a filename or path fragment
3. Select from the autocomplete list — the relative path is inserted

---

Made by [Devailab](https://devailab.com)
