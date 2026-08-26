@AGENTS.md

# Git

- **Commit as the repo owner, never as Claude.** Author every commit as
  `Rushab Munot <rushabmunot1@gmail.com>` (GitHub user `Rushab1`). Do not commit with the
  `noreply@anthropic.com` address, and do not add an Anthropic `Co-Authored-By` trailer.
  In a fresh container, set this before the first commit:
  ```
  git config user.name  "Rushab Munot"
  git config user.email "rushabmunot1@gmail.com"
  ```
- **Remote:** the repository now lives at `Rushab1/ml-system-design-lessons`. Pushes to the
  old `Life-Tracker-Personal` URL still succeed via redirect, so a "This repository moved"
  notice on push is expected and harmless.
