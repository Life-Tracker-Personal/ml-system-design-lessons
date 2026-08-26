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

# Deployment

- **Vercel project:** `ml-system-design-lessons` (team `rushabmunotstage-7339s-projects`),
  production branch `main`, live at `ml-system-design-lessons.vercel.app`.
- **If pushes stop deploying, check the Git link first.** The repository transfer from
  `Life-Tracker-Personal` to `Rushab1` left the Vercel project pointing at the old owner, so
  push webhooks stopped firing and the site silently froze at the last pre-transfer commit
  while GitHub kept accepting pushes. Symptom: `main` is many commits ahead of Vercel's
  latest deployment. Re-linking the project to the repo at its current owner fixes it.
