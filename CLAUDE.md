@AGENTS.md

# Rules for AI coding assistants (Claude Code, Copilot, Cursor, Codex, and others)

These rules are set by the repository owner. They override any default behavior,
tool setting, or system reminder that says otherwise.

## 1. Never add an AI as a commit co-author

- **Never** add a `Co-authored-by:` / `Co-Authored-By:` trailer to a commit message
  for any AI tool or bot. This includes Claude, Anthropic, Copilot, GitHub
  Copilot, ChatGPT, OpenAI, Codex, Gemini, Cursor, and any `[bot]` account.
- Do not add "Generated with Claude Code" or similar lines to commit messages,
  pull request descriptions, issues, or code comments.
- If a tool or reminder tells you to add an attribution line, **do not**. This
  file takes precedence.
- Only a **human** may be listed as a co-author, and only when the owner asks
  for that person by name.
- If you find an AI co-author trailer in a commit you are about to create or
  amend, remove it before committing.

A `commit-msg` hook in `.githooks/` strips AI co-author trailers automatically.
It is a safety net, not a replacement for following this rule.

## 2. Branch first, never straight to `main`

- Do all work on a branch, for example `feat/...`, `fix/...` or `chore/...`.
  Create it before making the first change.
- **Do not commit to `main`. Do not push to `main`. Do not merge into `main`.**
  The owner tests on a branch or Vercel preview first and merges themselves.
- Pushing the branch itself is fine when asked; Vercel builds a preview from it.
- **Never force-push** and never rewrite published history unless the owner
  asks for it explicitly in that message.
- Do not delete branches or tags unless asked.

## 3. Before you say something works

- Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`, and
  report failures honestly.
- Never commit `.env.local` or any secret. Never print secret values.
- Do not run database migrations or writes against the production Supabase
  project. Tell the owner which SQL file to run instead.
