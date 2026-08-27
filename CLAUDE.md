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
- **If pushes stop deploying, check the project's Git link first.** Read it with
  `vercel git ls`, or via the API where the project's `link` field should read
  `{ org: "Rushab1", repo: "ml-system-design-lessons" }`. A stale or null value means no push
  will ever deploy, while GitHub keeps accepting pushes and the site quietly serves the last
  build. Symptom: `main` sits many commits ahead of Vercel's latest deployment.
- **Root cause of the February outage, recorded so it is not re-diagnosed.** Transferring the
  repo from the `Life-Tracker-Personal` org to the personal `Rushab1` account demoted the
  GitHub user Vercel was authenticating as, `rushabmunotstage`, from org-level admin to a
  plain **write** collaborator. Write is enough for Vercel to clone the repo, which is why
  builds triggered by hand still worked and why the failure looked like a webhook bug, but
  **creating a push webhook requires admin**, so `vercel git connect` failed with a misleading
  "make sure you have access to the repository if it's private" on a public repo. Fixed by
  connecting Vercel's GitHub login as `Rushab1`, which holds admin, then running
  `vercel git connect`.
- **Two failure modes to keep apart.** A deployment created through the API or
  `create_git_project` defaults to `target: preview` no matter which branch it builds; only a
  deployment created by the Git integration on a push to `main` is stamped
  `target: production`. Seeing a healthy preview build while the production domain stays
  stale means the link is broken, not the build.
