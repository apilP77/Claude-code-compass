# Contributing

Thanks for helping improve Claude Code Compass. Contributions that improve listing accuracy, usability, accessibility, and reliability are welcome.

## Before opening an issue or pull request

- Use **Suggest a tool** to propose a repository for the directory.
- Use **Report a bad listing** to flag inaccurate, outdated, broken, or concerning information.
- For a security vulnerability, follow [SECURITY.md](./SECURITY.md) instead of opening a public issue.
- For larger changes, open an issue first so the approach can be discussed.

## Local development

1. Install Node.js 20.9 or later and npm.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local`. Set the public Supabase URL and anon key for app builds and voting. `GITHUB_TOKEN` and `GEMINI_API_KEY` are server-only and are needed only when running the discovery and enrichment scripts, respectively.
4. Run `npm run dev` to start the application.

Run the project checks before submitting:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Voting requires the migrations in `supabase/migrations/` to be applied to a configured Supabase project. Apply them in numerical order using the Supabase SQL Editor.

## Data pipeline

The pipeline scripts use the corresponding credentials from `.env.local`:

```bash
npm run discover
npm run enrich
npm run merge
```

`npm run pipeline` runs all three commands in order. These scripts update files under `data/`; review generated data before proposing changes to the curated directory.

## Pull requests

- Keep changes focused and explain the user-visible or maintenance impact.
- Add or update tests for behavior changes.
- Do not commit credentials, `.env.local`, generated secrets, or unrelated data changes.
- Include screenshots for visual changes when useful.
- Complete the checklist in the pull request template.
