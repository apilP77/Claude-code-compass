# Claude Code Compass

**Discover the tools. Understand the workflow.**

Claude Code Compass is a planned open-source directory and learning hub for discovering Claude Code skills, plugins, subagents, hooks, MCP servers, commands, configurations, and related developer tools.

The goal is to do more than list GitHub links. Each repository page should help someone understand what a tool does, who it is useful for, how to set it up, what its trade-offs are, and what to review before installing it.

> **Project status:** This README describes the intended product and implementation plan. The application is not considered complete until the features are built, tested, and documented in the repository.

## Why this project?

Useful tools are spread across repositories, marketplaces, blog posts, and community recommendations. New users may not know which kind of extension they need or whether a repository is maintained and relevant to their workflow.

Claude Code Compass aims to make discovery easier with searchable listings, plain-language explanations, setup guides, pros and cons, community voting, and automatic discovery of newly published or newly updated repositories.

## Main features

### 1. Searchable repository directory

- Search repository names, descriptions, tags, categories, and supported workflows.
- Filter by skills, plugins, subagents, hooks, MCP servers, commands, rules/configuration, and other developer tools.
- Sort by newest discovery, recently updated, GitHub stars, community votes, or curated recommendations where those values are available.
- Link directly to the original source repository and documentation.
- Show compatibility only when supported by repository documentation or another verifiable source.

### 2. Useful repository detail pages

Each listing should provide the available information below. Missing or unverified fields must be labelled clearly rather than guessed.

- **What it does:** a plain-language explanation.
- **Best for:** the users or tasks it may help.
- **Features:** what the repository actually provides.
- **Example use case:** a realistic example of when it might be useful.
- **Setup guide:** prerequisites, source-linked installation steps, and relevant configuration notes.
- **Pros:** concrete strengths, with evidence where possible.
- **Cons and limitations:** trade-offs, missing features, compatibility limits, dependencies, or maintenance concerns.
- **Security considerations:** permissions, shell commands, external services, credentials, or other risks users should inspect.
- **Repository facts:** source URL, owner, license information, stars, forks, last update, discovery date, and last metadata check where available.
- **Status labels:** for example, `new discovery`, `needs review`, `community listed`, `editor reviewed`, or `archived`.

Pros and cons should be based on the project's documentation, visible implementation, tests, release activity, or clearly identified editorial assessment. Do not generate unsupported claims just to fill a page.

### 3. Community quality voting

Every repository listing should offer:

- An **upvote** button for users who consider the repository useful or high-quality.
- A **downvote** button for users who consider it unhelpful, low-quality, outdated, or otherwise not recommended.
- Visible totals and a net/community score, with the calculation explained.
- A way for a user to change or remove their own vote.
- A clear distinction between community opinion and verified facts.

**Recommended voting rules:**

1. Require a signed-in user before accepting a persistent public vote.
2. Allow one active vote per user per repository. A database uniqueness constraint should enforce this rule; do not rely on hiding buttons in the frontend.
3. Allow users to change from upvote to downvote or remove their vote.
4. Apply basic rate limiting and monitor suspicious vote patterns.
5. Never describe a positive score as proof that a repository is safe. Popularity and security are different things.
6. Show a clear empty state when a repository has no votes.

A frontend-only counter or `localStorage` value is acceptable for a temporary visual prototype, but it is **not** a real community voting system. Votes that must be shared across visitors need a backend and database.

### 4. Automatic discovery of new repositories

The application should periodically search GitHub for relevant repositories, compare them with the directory, and add previously unseen candidates to the site.

The first implementation should use the **GitHub REST Search API**, not automated browser scraping. This makes the discovery process easier to test and gives the application structured repository metadata. This searches GitHub's indexed repositories; it does not search the entire public web.

Suggested discovery workflow:

1. Run a scheduled discovery job (initially once per day; make the schedule configurable).
2. Search several focused queries, such as repositories related to `claude-code`, Claude Code plugins, skills, hooks, MCP servers, and agents. Tune queries over time and avoid relying on a single keyword.
3. Retrieve repository metadata and, where permitted and practical, inspect its README or topics for relevance.
4. Normalize the repository's canonical URL and deduplicate by GitHub `owner/name` (case-insensitive) so the same repository is not added twice.
5. Skip or clearly flag irrelevant, unavailable, archived, or clearly duplicated entries. Lack of a detected license should be displayed as “No license detected”, not treated as permission to reuse its code.
6. Automatically create a listing in a **New Discoveries** area with a prominent `Auto-discovered — not yet reviewed` label.
7. Keep automatic discoveries separate from editor-reviewed recommendations until someone verifies the description, use case, setup guidance, and trade-offs.
8. Log the run time, search queries, candidates found, duplicates skipped, failures, and rate-limit responses.
9. Retry transient failures carefully, respect API rate limits and reset headers, and avoid an infinite retry loop.

This approach still automatically finds and adds new repositories to the website, while making clear that an automated match is not the same as an editorial endorsement. A later setting could enable direct publication after automated checks, but unreviewed entries must remain visibly labelled.

**Important distinction:** GitHub stars, recent activity, and search ranking can help with discovery. They do not prove that a tool is good, maintained, compatible, or safe. Historical snapshots are required to calculate star growth over time; a single API response cannot establish “stars gained this week.”

### 5. New, trending, and recently updated views

- **New Discoveries:** repositories first detected by the discovery job.
- **Recently Updated:** repositories with a recent pushed/updated timestamp.
- **Most Starred:** sorted by GitHub star count.
- **Trending:** based on measured changes across stored snapshots and a documented ranking formula.
- **Community Picks:** sorted by community votes, with anti-abuse safeguards.
- **Editor's Picks:** manually reviewed selections.

Do not call a repository “trending this week” unless the application has enough historical data to support that claim.

## Suggested technology stack

Keep the first version intentionally small. This is the proposed stack, not a claim that all parts have already been implemented.

- **Web application:** Next.js with TypeScript
- **Styling:** Tailwind CSS
- **Repository data for the first prototype:** a checked-in JSON/TypeScript data file
- **Persistent data and votes:** PostgreSQL through Supabase, or an equivalent database
- **Authentication:** Supabase Auth or another provider, with GitHub sign-in as a possible option
- **Discovery source:** GitHub REST API
- **Scheduled discovery:** GitHub Actions scheduled workflow or a server-side scheduled job
- **Tests:** unit tests for filtering/scoring and integration tests for repository imports and votes; add browser-level tests for critical flows later
- **Deployment:** a Next.js-compatible host; keep database and API secrets server-side

You do not need to build all of this at once. Start with a curated directory and detail pages, then add persistent voting and automated discovery in separate milestones.

## Suggested data model

The schema can change as the app develops, but these concepts should be separated.

### `repositories`

- `id`
- `github_owner`
- `github_name`
- `canonical_url`
- `description`
- `categories` and `tags`
- `explanation`
- `use_cases`
- `pros` and `cons`
- `setup_notes` and source links
- `license_spdx` (nullable)
- `stars`, `forks`, `pushed_at`
- `discovered_at`, `last_checked_at`
- `listing_status` (for example, `unreviewed`, `reviewed`, `rejected`, `archived`)
- `created_at`, `updated_at`

### `votes`

- `id`
- `repository_id`
- `user_id`
- `value` (`1` for upvote or `-1` for downvote)
- `created_at`, `updated_at`
- A unique constraint on `(repository_id, user_id)`

### `discovery_runs`

- `id`
- `started_at`, `finished_at`
- `status`
- `queries_run`
- `candidates_found`, `new_repositories_added`, `duplicates_skipped`
- `error_summary`

The database must enforce vote uniqueness and authorization rules. Client-side checks alone are not sufficient.

## Repository quality and trust principles

- Link to the original repository and preserve its identity and attribution.
- Clearly distinguish GitHub metadata from community votes and editorial opinions.
- Do not claim that a repository is secure merely because it has stars, votes, or an `editor reviewed` badge.
- Review installation commands, file access, shell execution, external services, and requested secrets before publishing setup advice.
- Treat missing license information as unknown; do not imply that a repository is open-source merely because its source is publicly viewable.
- Respect GitHub API rate limits, terms, and attribution requirements.
- Store secrets only in server-side environment variables; never commit API tokens or service-role keys.
- Provide a correction/reporting path for inaccurate, unsafe, broken, or outdated listings.

## Pros and cons of this project idea

### Pros

- Solves a real discovery and learning problem for people exploring Claude Code tools.
- Can grow gradually from a simple directory into a more capable application.
- Demonstrates frontend development, data modeling, external API integration, automation, testing, and deployment.
- Open-source contributors can add and improve repository entries.
- Community voting provides a useful signal when paired with transparent rules and abuse prevention.
- The discovery pipeline creates a practical use case for scheduled jobs and monitoring.

### Cons and challenges

- The ecosystem changes quickly, so entries and installation instructions can become stale.
- Repository search can return irrelevant results and miss good projects; search queries need ongoing tuning.
- GitHub API rate limits mean discovery must be cached, scheduled, and designed to back off correctly.
- Votes can be manipulated, brigaded, or confused with security endorsements.
- Pros, cons, and setup instructions take editorial effort to keep accurate.
- Automated scraping of READMEs or other pages can have reliability, terms, and attribution concerns; prefer official APIs and linked source material.
- A directory without a clear advantage over existing catalogs may struggle to attract contributors. Clear explanations and trustworthy discovery should be the differentiator.

## Getting started

### Prerequisites

- Node.js LTS and npm
- Git
- A GitHub account if you want to contribute through GitHub

### If you are creating the app from scratch

Run this command in the parent directory where you want the project folder to live:

```bash
npx create-next-app@latest claude-code-compass --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Then copy this `README.md` and `TODO.md` into the new `claude-code-compass` folder. If you already have an application repository, do **not** run the scaffolding command over it; copy the documents into your existing project instead.

### Run the app

After the application code and `package.json` have been created:

```bash
cd claude-code-compass
npm install
npm run dev
```

Open the local URL printed by Next.js in your terminal (usually `http://localhost:3000`).

**Note:** These two documentation files alone do not contain the application source code, so `npm run dev` will not work until the app has been scaffolded and implemented.

### Environment variables

Do not add secrets until the relevant integrations are implemented. When they are needed, document them in an `.env.example` file with placeholder values. Typical server-side variables may include:

```text
GITHUB_TOKEN=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use only the variables that the implementation actually needs. Keep privileged keys such as `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never prefix a secret with `NEXT_PUBLIC_`, commit a real `.env.local` file, or paste secrets into issues or logs.

## Setup

Use Node.js 20 and npm. In Windows PowerShell, use `npm.cmd` to run npm scripts:

```powershell
npm.cmd ci
npm.cmd run dev
```

Run the project's checks with:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

The `typecheck` script runs `next typegen && tsc --noEmit`.

## Deployment

Deploy through Vercel by importing the project from GitHub. Select the repository and keep the detected Next.js framework, root directory, build command, and output settings at their defaults. No environment variables are required for the current application. Deploy the project, then use the Vercel-provided URL to verify the site.

## Contributing

Contributions are welcome once the project structure is in place. Useful early contributions include:

- Suggesting a relevant repository with its source URL.
- Improving an explanation or setup guide.
- Reporting an incorrect or outdated entry.
- Adding a test, accessibility improvement, or discovery query.
- Improving documentation.

Before contributing, please check the original repository's license and attribution requirements. A `CONTRIBUTING.md`, issue templates, and project license should be added before the project invites broad outside contributions.

## Roadmap

See [`TODO.md`](./TODO.md) for the phased implementation checklist.

## Sources and useful references

- [Claude Marketplace — Plugins](https://claude.com/marketplace/plugins)
- [Anthropic Claude Code plugin examples](https://github.com/anthropics/claude-code/tree/main/plugins)
- [GitHub REST API — Search repositories](https://docs.github.com/en/rest/search/search)
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub Actions — Events that trigger workflows, including schedules](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

These links are starting points. Verify current endpoint behavior and rate limits during implementation because platform documentation and limits can change.

## Project identity

Claude Code Compass is an independent community project and is not affiliated with, endorsed by, or an official product of Anthropic. Product names are used only to describe the ecosystem this project catalogs.
