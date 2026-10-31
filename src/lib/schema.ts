import { z } from "zod";

/**
 * The `repositories` record shape for Claude Code Compass — M1.
 *
 * This file is the single source of truth for `data/repos.json`.
 * `src/lib/repos.ts` parses that file against `repositoriesFileSchema` at
 * module load, so `next build` fails when the data does not match this
 * contract instead of shipping a half-broken listing.
 *
 * The core shape is the minimum needed to list and filter a curated directory.
 * Optional `pros`, `cons`, and `security_notes` fields support M2 AI
 * enrichment; they remain absent until a repository has been enriched.
 * Other editorial fields and discovery/review-cycle timestamps remain out of
 * scope until there is data to populate them.
 *
 * Two rules still matter:
 *
 *   1. Unknown scalars are `null` — never `undefined`, never `""`.
 *      SQL has NULL and no `undefined`, and `""` reads as a *verified* empty
 *      value. "We did not check" must stay distinguishable from "we checked
 *      and found nothing".
 *   2. Unknown collections are `[]`, not `null`. An empty array means "none
 *      recorded". The null/unknown distinction lives on scalars only.
 */

/** The categories the directory filters by. Fixed set so filters stay honest. */
export const CATEGORIES = [
  "skills",
  "plugins",
  "collections",
  "directories",
] as const;

/**
 * Editorial state of a listing.
 * - `unreviewed`: discovered or added, content not verified by an editor.
 * - `reviewed`: an editor verified the record.
 */
export const LISTING_STATUSES = ["unreviewed", "reviewed"] as const;

const repositoryId = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/, {
    message: 'must be a lowercase "owner/name" pair',
  })
  .describe(
    "Deduplication key: `${owner}/${name}` lowercased. Also the URL path segment.",
  );

export const repositorySchema = z
  .strictObject({
    id: repositoryId,

    owner: z.string().min(1).describe("GitHub owner or organization."),
    name: z.string().min(1).describe("GitHub repository name."),
    url: z
      .url()
      .describe("Canonical source URL, e.g. https://github.com/owner/name."),

    description: z
      .string()
      .min(1)
      .max(280)
      .describe("One-sentence summary used on cards and in search."),

    category: z
      .enum(CATEGORIES)
      .describe("Primary category; drives the category filter."),
    tags: z
      .array(z.string().min(1))
      .describe("Free-form keywords. Empty array when none are recorded."),

    license_spdx: z
      .string()
      .min(1)
      .nullable()
      .describe(
        "SPDX identifier. Null means unknown — never imply permission to reuse code.",
      ),
    stars: z.int().min(0).nullable().describe("GitHub star count. Null if unfetched."),
    forks: z.int().min(0).nullable().describe("GitHub fork count. Null if unfetched."),

    pros: z
      .tuple([z.string().min(1), z.string().min(1)])
      .optional()
      .describe("Two AI-generated repository advantages, when available."),
    cons: z
      .tuple([z.string().min(1), z.string().min(1)])
      .optional()
      .describe("Two AI-generated repository limitations, when available."),
    security_notes: z
      .string()
      .min(1)
      .optional()
      .describe("AI-generated security notes, when available."),

    listing_status: z
      .enum(LISTING_STATUSES)
      .describe("Editorial state; drives the status label in the UI."),
    last_reviewed: z.iso
      .date()
      .nullable()
      .describe("Date an editor last verified the record. Null if unreviewed."),
  })
  .superRefine((repo, ctx) => {
    const expectedId = `${repo.owner}/${repo.name}`.toLowerCase();
    if (repo.id !== expectedId) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: `must equal "${expectedId}" (lowercased owner/name)`,
      });
    }

    // A "reviewed" badge is a promise to the reader. Refuse to store one
    // without the date that justifies it.
    if (repo.listing_status === "reviewed" && repo.last_reviewed === null) {
      ctx.addIssue({
        code: "custom",
        path: ["last_reviewed"],
        message: "a reviewed listing needs a last_reviewed date",
      });
    }
  });

/** Top-level shape of `data/repos.json`. `schema_version` gates future migrations. */
export const repositoriesFileSchema = z.strictObject({
  schema_version: z.literal(1).describe("Bump when the record shape changes."),
  repositories: z.array(repositorySchema),
});

export type Repository = z.infer<typeof repositorySchema>;
export type Category = (typeof CATEGORIES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type RepositoriesFile = z.infer<typeof repositoriesFileSchema>;
