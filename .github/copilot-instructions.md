# Instructions for GitHub Copilot

Follow `CLAUDE.md` and `AGENTS.md` in the repository root. The important rules:

- **Do not add yourself, or any AI tool, as a commit co-author.** Never write a
  `Co-authored-by:` line for Copilot, Claude, or any other AI or bot in commit
  messages or pull request descriptions. Only a human may be a co-author, and
  only when the owner names them.
- **Work on a branch.** Never commit, push, or merge directly to `main`.
- **Never force-push** unless the owner explicitly asks.
- This project uses a newer Next.js than your training data. Read
  `node_modules/next/dist/docs/` before writing Next.js code.
- Never commit `.env.local` or secrets.
