# Claude Code Compass — TODO

> **MVP = static curated directory. Voting and discovery are post-MVP, tracked below.**

This checklist describes a sensible build order. Keep milestones small, verify each one, and update this file as work is completed.

## MVP (M1) — static curated directory

### Project definition

- [ ] Confirm the working name and check repository/domain availability.
- [ ] Create the public GitHub repository.
- [ ] Add `README.md`, `TODO.md`, and a project license after choosing the license terms.
- [ ] Define what counts as a valid Claude Code-related repository.
- [ ] Decide the first categories: skills, plugins, subagents, hooks, MCP servers, commands, rules/configuration, and developer tools.
- [ ] Write a short source and attribution policy.

### Build the directory

- [ ] Scaffold the Next.js + TypeScript + Tailwind application.
- [ ] Establish the visual design system, responsive navigation, typography, spacing, and accessible colors.
- [ ] Create a small structured local dataset of real, verified repositories.
- [ ] Record each repository's canonical URL, owner/name, short description, categories, tags, and source links.
- [ ] Build the homepage and searchable repository directory.
- [ ] Implement search by repository name, description, category, and tags.
- [ ] Add category filters and sorting for fields that actually exist in the dataset.
- [ ] Add repository cards with clear labels and links to original sources.
- [ ] Build an individual repository detail page.
- [ ] Add sections for what it does, who it is for, examples, setup instructions, pros, cons, compatibility, and caveats.
- [ ] Label unknown or unverified data instead of making assumptions.
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

- [ ] Add `.env.example` with placeholder values only.
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
- [ ] Mark automatic entries clearly as `Auto-discovered — not yet reviewed`.
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

- [ ] Choose and configure a database (proposed: PostgreSQL through Supabase).
- [ ] Choose an authentication approach (proposed: Supabase Auth, possibly with GitHub sign-in).
- [ ] Design the `votes` table with `repository_id`, `user_id`, vote value (`1` or `-1`), and timestamps.
- [ ] Enforce a database uniqueness constraint on `(repository_id, user_id)`.
- [ ] Add upvote and downvote buttons to repository cards and detail pages.
- [ ] Show upvote count, downvote count, and/or net score with a clear scoring explanation.
- [ ] Let a signed-in user change or remove their vote.
- [ ] Enforce authorization and vote validation server-side and in database policies.
- [ ] Add basic rate limiting and monitoring for suspicious vote behavior.
- [ ] Handle signed-out users, missing votes, failed requests, and loading states.
- [ ] Add tests for duplicate voting, vote changes, vote removal, and unauthorized access.
- [ ] Explain in the interface that community votes measure opinion, not security or factual correctness.

#### Done when

- [ ] Voting is stored persistently, is limited to one active vote per user/repository, and can be changed.

### M4 — Scheduled discovery + activity views

- [ ] Add `New Discoveries` sorted by discovery date.
- [ ] Add `Recently Updated` based on verified GitHub timestamps.
- [ ] Add `Most Starred` sorting.
- [ ] Store periodic metadata snapshots to support trends over time. *(M4 starts collecting snapshots only; display lands in Trending.)*
- [ ] Keep editor picks, community score, stars, and activity as separate signals.
- [ ] Add a scheduled GitHub Actions workflow or a reliable server-side scheduler for discovery.
- [ ] Ensure the scheduled workflow can be run manually for testing.
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
