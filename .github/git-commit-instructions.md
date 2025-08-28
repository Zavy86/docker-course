# Git Commit Instructions

- Use Conventional Commits format
- Use English for all commit messages
- Follow the convention: `<type>(<scope>): <short summary>`
    - Examples of `type`: feat, fix, docs, style, refactor, test, chore, content
    - `scope` is optional and indicates the chapter, section, or book part
    - The `short summary` must be concise (max 72 characters)
- If necessary, add a detailed description after a blank line
- Use the present imperative (e.g., "add", "fix", "update", "remove")
- If the commit affects multiple chapters or sections, specify them in the `scope`
- If a file is in the /source directory, use `source` as the type

## Examples:
- `content(ch1): add introduction to programming concepts`
- `docs(readme): update installation instructions`
- `feat(exercises): add practice problems for loops`
- `content(ch5,ch6): reorganize data structures content`
- `source(example): correct code example syntax error`
- `style: fix formatting in chapter 2`
