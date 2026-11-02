# Claude Code Compass — TODO

> **MVP = static curated directory. Voting and discovery are post-MVP, tracked below.**

This checklist describes a sensible build order. Keep milestones small, verify each one, and update this file as work is completed.

---

## 🔜 Next round (Nov 2026)

Suggested order: **1 → 2 → 3 → 4 → 5**. Fix voting first because it's broken. Better AI summaries (2) make the UI (3) and the Skill Set Finder (4) much better, so do 2 before them.

### 1. Fix upvote / downvote

What I checked: the `get_repository_vote_score` function is deployed in Supabase (HTTP 200), and GitHub sign-in is enabled. So the bug is most likely in the app's auth wiring, not the database.

- [ ] **Reproduce first.** Open a repo detail page, open DevTools → Network, and click Upvote. Write down the `/api/votes` status code and the error text shown under the buttons.
- [x] Add `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`, see `node_modules/next/dist/docs/`) to refresh the Supabase session on every request. Without it, the access token expires after about an hour. Then `/api/votes` returns "Sign in before voting." even though the header still shows you as logged in.
- [x] Add `src/app/auth/callback/route.ts` that calls `exchangeCodeForSession`. Point `redirectTo` in `Header.tsx` and `VoteButtons.tsx` at it, with a `next` param, so the user lands back on the repo they were voting on instead of the homepage.
- [ ] In Supabase → Auth → URL Configuration, check that the Site URL and redirect allowlist include `http://localhost:3000/**` and the production domain.
- [ ] Confirm migration `002_vote_rate_limits.sql` is applied (`submit_repository_vote` exists).
- [x] Clicking your current vote again should remove it (toggle). Add a `remove_repository_vote` RPC. *(Done in code: `003_remove_vote.sql` + `DELETE /api/votes`. **You must run the SQL in Supabase.**)*
- [ ] Show separate up/down counts and your own vote state, not just the net score.
- [x] Signed-out users should see "Sign in with GitHub to vote" instead of being silently redirected.
- [ ] Show scores on homepage cards via one batched RPC (`get_repository_vote_scores(ids text[])`), not one request per card.
- [ ] Tests: signed-out vote, vote change, vote removal, expired session.

### 2. Gemini-written descriptions instead of a bare "⚠ Unreviewed"

Today all 20 listings show an orange "⚠ Unreviewed" badge, which reads like a danger warning. Only 2 of 20 have pros/cons. Descriptions are the raw GitHub one-liners.

- [x] Extend the enrichment output (`src/lib/enrichment.ts` + `src/lib/schema.ts`):
  - `summary`: 2–3 plain-English sentences on what it does.
  - `best_for`: who should use it and when.
  - `highlights`: 3 short bullets.
  - `getting_started`: install command, **quoted from the README only**, or null.
  - Keep `pros`, `cons`, and `security_notes`.
- [x] Add `ai_generated_at` and `ai_model` fields so every AI text says where it came from.
- [x] Replace the badge: "✨ AI summary · not editor-verified" (neutral/info style) for enriched repos. Keep "Unreviewed" only for repos with no summary yet. Never present AI text as verified.
- [x] Improve the prompt: a good vs. bad example, no marketing words ("powerful", "seamless"), every claim grounded in the README, plain language, and a length cap.
- [x] Backfill: add `npm run enrich -- --all` to re-enrich the 20 existing repos, not only new candidates.
- [x] Make one failure non-fatal. Right now a single README 404 or Gemini error throws inside the loop in `scripts/enrich.ts` and aborts the whole run. Catch it per repo, log it, and continue.
- [x] Log which model actually answered. *(Found: the `gemini-2.5-flash-lite` fallback returns 404 now, so it was removed; `GEMINI_MODEL` env overrides the default. Free tier is 15 requests/min, so calls are paced and 429s are retried.)*
- [x] Keep the prompt-injection defenses and the `malicious-readme.md` test passing. Add tests for the new fields.

### 3. Better interface / UI (items 3 + 5 combined)

What's wrong now: there are three visual systems. The header and cards use dark slate/cyan, and the homepage and detail page use zinc/teal with light/dark variants. `layout.tsx` forces a dark body, but the homepage wrapper turns light grey in light mode, so the page is light under a dark header. `globals.css` also sets `font-family: Arial`, which overrides the Geist font.

- [x] Pick a design direction and write `DESIGN.md` (colors, type, spacing, components) *before* restyling. *(Written by hand; the plugin was not loaded in that session.)*
- [x] Choose dark-only *or* real light/dark, then put one palette in `globals.css` `@theme` tokens. Remove the hard-coded slate/zinc/teal mix.
- [x] Remove the Arial override so Geist actually loads.
- [x] Homepage: shorter hero, instant search as you type, and a **sort dropdown** (stars, votes, name, newest). `search.ts` already supports sorting, but the UI doesn't expose it.
- [ ] Cards: AI summary snippet, stars + vote score, category icon, new badge style.
- [x] Detail page layout: summary → best for → highlights → getting started (with a copy button) → pros/cons side by side → security notes → votes. Add a sidebar with stars, license, and links.
- [x] "Log In" → "Sign in with GitHub".
- [ ] Loading skeletons, a friendly empty state, mobile layout check, keyboard focus, and contrast check.
- [ ] Run the **frontend-design** skill for polish once DESIGN.md exists.

### 4. Skill Set Finder ("I'm building X, what should I install?")

The user describes what they're working on and gets a recommended set of skills/plugins from the directory.

- [ ] New page `/skill-set` with a textbox ("I'm building a Next.js SaaS with Stripe and Supabase…") plus optional chips (frontend, backend, testing, data, docs, security).
- [ ] Server route `/api/skill-set` sends Gemini the user's text plus the catalog (id, summary, tags, category). **Gemini may only pick IDs that exist in our catalog.** Validate with zod and drop unknown IDs, so it can't invent repos.
- [ ] Return 3–7 picks grouped by role (Planning, Building UI, Testing, Review, …). Each pick gets a one-line reason and its install command when known.
- [ ] "Copy all install commands" button and a shareable URL (`/skill-set?q=…`).
- [ ] Fallback when Gemini fails or the key is missing: tag/keyword matching via `search.ts`.
- [ ] Safety: input length cap, per-IP rate limit, user text treated as data, Gemini key server-only.
- [ ] Label: "AI suggestions — check each repo before installing."
- [ ] Later: hand-picked **starter kits** ("Web app", "Python data", "Code review") as a non-AI option.
- [ ] Depends on item 2 (good summaries = good matches).

### 5. Suggestions (my ideas)

- [ ] **Grow the catalog.** There are only 20 repos, and `CATEGORIES` has 4 (skills, plugins, collections, directories). Add hooks, MCP servers, subagents, and commands, which the project definition below already lists.
- [ ] **Save my kit:** signed-in users bookmark repos or save a Skill Set result (Supabase table, same RLS pattern as votes).
- [ ] **Compare view:** 2–3 repos side by side (pros, cons, license, stars, install).
- [ ] **"New this week"** section on the homepage, fed by the nightly discovery runs.
- [ ] **Submit a repo** button that opens a prefilled GitHub issue.
- [ ] **Stale/archived warning** when a repo hasn't been updated in 6+ months or is archived.
- [ ] **Per-repo social preview images** (Open Graph) so shared links look good.
- [ ] **Privacy-friendly analytics** on searches. Zero-result searches show what to add next and can feed discovery queries.

---

## MVP (M1) — static curated directory

### Project definition

- [ ] Confirm the working name and check repository/domain availability.
- [ ] Create the public GitHub repository.
- [ ] Add `README.md`, `TODO.md`, and a project license after choosing the license terms.
- [ ] Define what counts as a valid Claude Code-related repository.
- [ ] Decide the first categories: skills, plugins, subagents, hooks, MCP servers, commands, rules/configuration, and developer tools.
- [ ] Write a short source and attribution policy.

### Build the directory

- [x] Scaffold the Next.js + TypeScript + Tailwind application.
- [ ] Establish the visual design system, responsive navigation, typography, spacing, and accessible colors.
- [ ] Create a small structured local dataset of real, verified repositories.
- [ ] Record each repository's canonical URL, owner/name, short description, categories, tags, and source links.
- [x] Build the homepage and searchable repository directory.
- [ ] Implement search by repository name, description, category, and tags.
- [ ] Add category filters and sorting for fields that actually exist in the dataset.
- [x] Add repository cards with clear labels and links to original sources.
- [x] Build an individual repository detail page.
- [ ] Add sections for what it does, who it is for, examples, setup instructions, pros, cons, compatibility, and caveats.
- [x] Label unknown or unverified data instead of making assumptions.
- [ ] Add loading, empty, error, and not-found states.
- [ ] Check keyboard navigation, responsive layouts, and basic accessibility.
- [ ] Add automated tests for search, filtering, sorting, and data validation.
- [ ] Write local setup instructions and confirm a new contributor can run the app.

### Editorial standards

- [ ] Create a consistent template for pros, cons, setup steps, and example use cases.
- [ ] Link installation commands and technical claims to original project documentation.
- [ ] Add an editorial status and a `last reviewed` date.
- [ ] Add a way to report broken links, outdated setup steps, unsafe behavior, or inaccurate data.
- [ ] Review permissions and installation steps before labeling a tool as reviewed.
- [ ] Never use votes or GitHub stars as a standalone safety score.
- [ ] Avoid copying entire READMEs; summarize, attribute, and link to the source.

### Ship it

- [x] Add `.env.example` with placeholder values only.
- [ ] Ensure real secrets and `.env.local` are ignored by Git.
- [ ] Add linting, type checking, build checks, and tests to CI.
- [ ] Deploy a preview environment and verify critical flows.
- [ ] Deploy the production site.
- [ ] Document deployment and secret configuration. *(Database setup and authentication callback URLs are added in M3.)*

### Done when

- [ ] A visitor can search and filter repository entries.
- [ ] Each repository has a useful detail page with source links.
- [ ] Pros, cons, and setup instructions are evidence-based or clearly labelled as unverified.
- [ ] API tokens and privileged keys are not exposed to browsers or committed to Git.
- [ ] Build, lint, and relevant tests pass.
- [ ] The README accurately describes implemented functionality and known limitations.
- [ ] A new contributor can follow the setup guide successfully.

## Post-MVP

### M2 — Discovery (sandbox, PR-reviewed)

- [ ] Create a server-side GitHub API client.
- [ ] Keep the GitHub token server-side and add only placeholder entries to `.env.example`.
- [ ] Define and document focused search queries for skills, plugins, agents, hooks, MCP servers, and related Claude Code repositories.
- [ ] Test the queries manually and record examples of relevant and irrelevant results.
- [ ] Implement a discovery job that searches GitHub on a configurable schedule.
- [ ] Retrieve required metadata, including canonical repository identity, description, topics, stars, fork count, license when available, archived status, and last update.
- [ ] Normalize repository identity and deduplicate by canonical `owner/name` and URL.
- [ ] Add database constraints that prevent duplicate repository records. *(M2: uniqueness is enforced in `src/lib/repos.ts` and in CI; the Postgres constraint is added in M4.)*
- [ ] Add new eligible repositories automatically to a `New Discoveries` section. *(M2: writes to `data/repos.json` with `listing_status: "unreviewed"`; DB-backed in M4.)*
- [x] Mark automatic entries clearly as `Auto-discovered — not yet reviewed`.
- [ ] Preserve original repository links and source metadata.
- [ ] Show missing license data as unknown rather than implying permission to reuse code.
- [ ] Flag archived, broken, irrelevant, or stale candidates rather than silently recommending them.
- [ ] Keep unreviewed discoveries separate from editor-reviewed recommendations.
- [ ] Add a manual approve, edit, reject, or archive workflow for maintainers.
- [ ] Store discovery run status, timestamps, candidate counts, duplicates skipped, and error summaries. *(M2: `data/discovery-runs/*.json`; the `discovery_runs` table is added in M4.)*
- [ ] Implement safe retries and backoff for transient errors and rate limiting.
- [ ] Add tests for duplicates, missing fields, invalid responses, and API failures.
- [ ] Document that this searches GitHub's index, not the entire public web.

#### Done when

- [ ] Newly discovered GitHub repositories are deduplicated and clearly labelled as unreviewed.

### M3 — Voting (Postgres + auth)

- [x] Choose and configure a database (proposed: PostgreSQL through Supabase).
- [x] Choose an authentication approach (proposed: Supabase Auth, possibly with GitHub sign-in).
- [ ] Design the `votes` table with `repository_id`, `user_id`, vote value (`1` or `-1`), and timestamps.
- [x] Enforce a database uniqueness constraint on `(repository_id, user_id)`.
- [ ] Add upvote and downvote buttons to repository cards and detail pages.
- [ ] Show upvote count, downvote count, and/or net score with a clear scoring explanation.
- [ ] Let a signed-in user change or remove their vote.
- [x] Enforce authorization and vote validation server-side and in database policies.
- [ ] Add basic rate limiting and monitoring for suspicious vote behavior.
- [ ] Handle signed-out users, missing votes, failed requests, and loading states.
- [ ] Add tests for duplicate voting, vote changes, vote removal, and unauthorized access.
- [x] Explain in the interface that community votes measure opinion, not security or factual correctness.

#### Done when

- [ ] Voting is stored persistently, is limited to one active vote per user/repository, and can be changed.

### M4 — Scheduled discovery + activity views

- [ ] Add `New Discoveries` sorted by discovery date.
- [ ] Add `Recently Updated` based on verified GitHub timestamps.
- [ ] Add `Most Starred` sorting.
- [ ] Store periodic metadata snapshots to support trends over time. *(M4 starts collecting snapshots only; display lands in Trending.)*
- [ ] Keep editor picks, community score, stars, and activity as separate signals.
- [x] Add a scheduled GitHub Actions workflow or a reliable server-side scheduler for discovery.
- [x] Ensure the scheduled workflow can be run manually for testing.
- [ ] Add error reporting for failed discovery runs.
- [ ] Add a health/status check for the application and discovery job.
- [ ] Test recovery from API errors, database downtime, and rate-limit responses.

### Trending — calendar-gated

Blocked until M4 has collected roughly four weeks of snapshots. The code can be written earlier; the label cannot be shown honestly before then.

- [ ] Calculate star growth over a defined time window only when enough historical snapshots exist.
- [ ] Define and publish a transparent trending formula.
- [ ] Add tests for sorting and trend calculations.

### Phase 7 — Open-source community

- [ ] Add `CONTRIBUTING.md`, a code of conduct, and basic issue templates before inviting community contributions.
- [ ] Add a repository submission form or GitHub issue template.
- [ ] Add a contributor guide with local setup and coding conventions.
- [ ] Add a pull request template and issue labels.
- [ ] Add validation for submitted repository entries.
- [ ] Explain how moderators decide whether to list or feature a repository.
- [ ] Publish the project's license and contribution rules.
- [ ] Add a process for correcting, hiding, or removing problematic entries.
- [ ] Ask a few people who use Claude Code to test the directory and give feedback.
- [ ] Fix the most confusing parts of discovery and repository detail pages.
