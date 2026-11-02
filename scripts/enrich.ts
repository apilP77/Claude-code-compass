import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEnrichmentPrompt,
  enrichmentResponseJsonSchema,
  enrichmentSystemInstruction,
  groundGettingStarted,
  parseEnrichment,
  type Enrichment,
} from "../src/lib/enrichment";
import {
  repositoriesFileSchema,
  repositorySchema,
  type Repository,
} from "../src/lib/schema";
import { getMaxNewRepositories } from "./discovery-utils";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidatesPath = resolve(projectRoot, "data/candidates.json");
const enrichedPath = resolve(projectRoot, "data/enriched.json");
const repositoriesPath = resolve(projectRoot, "data/repos.json");

config({ path: resolve(projectRoot, ".env.local") });

type Candidate = Repository;

const geminiTimeoutMs = Number(process.env.GEMINI_TIMEOUT_MS) || 15_000;
// gemini-2.5-flash-lite is no longer available to new users (404), so there is no
// working fallback model. Set GEMINI_MODEL to override the default.
const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
// Free tier allows 15 requests/minute; stay under it with a small safety margin.
const minMsBetweenRequests = 4_500;
const maxRateLimitRetries = 3;
const maxValidationAttempts = 2;

const sleep = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
let lastRequestAt = 0;

/**
 * `npm run enrich`                  enrich new discovery candidates (nightly job).
 * `npm run enrich -- --all`         backfill AI fields on repositories in data/repos.json
 *                                   that do not have a summary yet, in place.
 * `npm run enrich -- --all --force` re-generate AI fields for every repository.
 */
const args = new Set(process.argv.slice(2));
const backfillAll = args.has("--all");
const force = args.has("--force");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function fetchReadme(candidate: Candidate): Promise<string> {
  const owner = encodeURIComponent(candidate.owner);
  const name = encodeURIComponent(candidate.name);
  const mainUrl = `https://raw.githubusercontent.com/${owner}/${name}/main/README.md`;
  const mainResponse = await fetch(mainUrl);

  if (mainResponse.ok) {
    return mainResponse.text();
  }
  if (mainResponse.status !== 404) {
    throw new Error(
      `Could not fetch README for ${candidate.owner}/${candidate.name}: ${mainResponse.status} ${mainResponse.statusText}`,
    );
  }

  const masterUrl = `https://raw.githubusercontent.com/${owner}/${name}/master/README.md`;
  const masterResponse = await fetch(masterUrl);
  if (!masterResponse.ok) {
    throw new Error(
      `Could not fetch README for ${candidate.owner}/${candidate.name}: ${masterResponse.status} ${masterResponse.statusText}`,
    );
  }
  return masterResponse.text();
}

async function generate(
  ai: GoogleGenAI,
  contents: string,
  label: string,
): Promise<{ text: string; model: string }> {
  for (let attempt = 0; ; attempt += 1) {
    const wait = lastRequestAt + minMsBetweenRequests - Date.now();
    if (wait > 0) {
      await sleep(wait);
    }
    lastRequestAt = Date.now();

    try {
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: enrichmentResponseJsonSchema,
          systemInstruction: enrichmentSystemInstruction,
        },
      });
      if (!response.text) {
        throw new Error("Gemini returned an empty response.");
      }
      return { text: response.text, model: geminiModel };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retryAfter = /"code":429/.test(message)
        ? /retry in ([\d.]+)s/i.exec(message)
        : null;
      if (retryAfter && attempt < maxRateLimitRetries) {
        const seconds = Math.ceil(Number(retryAfter[1])) + 1;
        console.warn(`${label}: rate limited, waiting ${seconds}s.`);
        await sleep(seconds * 1000);
        continue;
      }
      // Keep the log readable: the raw API error is a large JSON blob.
      const short = /"message":"([^"]{0,160})/.exec(message)?.[1] ?? message.slice(0, 160);
      throw new Error(`${geminiModel} failed for ${label}: ${short}`, { cause: error });
    }
  }
}

/** Fetches the README and asks Gemini for the AI fields. Never touches editorial fields. */
async function generateAiFields(
  ai: GoogleGenAI,
  repository: Repository,
): Promise<Pick<
  Repository,
  | "summary"
  | "best_for"
  | "highlights"
  | "getting_started"
  | "pros"
  | "cons"
  | "security_notes"
  | "ai_generated_at"
  | "ai_model"
>> {
  const label = repository.id;
  const readme = await fetchReadme(repository);
  if (!readme.trim()) {
    throw new Error(`README for ${label} is empty.`);
  }

  // The model sometimes misses a required field (e.g. security notes that never
  // mention API keys). Retry once rather than dropping the repository.
  let enrichment: Enrichment | undefined;
  let model = geminiModel;
  for (let attempt = 1; enrichment === undefined; attempt += 1) {
    const result = await generate(ai, buildEnrichmentPrompt(readme), label);
    model = result.model;
    try {
      enrichment = parseEnrichment(JSON.parse(result.text));
    } catch (error) {
      if (attempt >= maxValidationAttempts) {
        throw error;
      }
      console.warn(`${label}: invalid response, retrying once.`);
    }
  }

  return {
    ...enrichment,
    getting_started: groundGettingStarted(enrichment.getting_started, readme),
    ai_generated_at: new Date().toISOString(),
    ai_model: model,
  };
}

function createClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to the project root .env.local file.",
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: geminiTimeoutMs,
      retryOptions: { attempts: 1 },
    },
  });
}

/** Runs `work` on each item; one failure is logged and skipped, not fatal. */
async function forEachSafely<T>(
  items: T[],
  idOf: (item: T) => string,
  work: (item: T) => Promise<void>,
): Promise<{ succeeded: number; failed: number }> {
  let succeeded = 0;
  let failed = 0;
  for (const item of items) {
    try {
      await work(item);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      console.warn(
        `Skipped ${idOf(item)}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return { succeeded, failed };
}

function reportOutcome(succeeded: number, failed: number): void {
  console.log(`Enriched ${succeeded}, skipped ${failed}.`);
  // One bad README must not fail the nightly run; only fail when nothing worked.
  if (succeeded === 0 && failed > 0) {
    process.exitCode = 1;
  }
}

async function enrichNewCandidates(): Promise<void> {
  const contents = await readFile(candidatesPath, "utf8");
  const input: unknown = JSON.parse(contents);
  if (!isRecord(input) || !Array.isArray(input.repositories)) {
    throw new Error(`${candidatesPath} has an invalid repositories file shape.`);
  }

  const repositoryRecords: unknown[] = input.repositories;
  const candidates: Candidate[] = [];
  for (const record of repositoryRecords) {
    const parsedCandidate = repositorySchema.safeParse(record);
    if (parsedCandidate.success) {
      candidates.push(parsedCandidate.data);
    }
  }
  const invalidCandidateCount = repositoryRecords.length - candidates.length;
  if (invalidCandidateCount > 0) {
    console.warn(`Skipped ${invalidCandidateCount} invalid discovery candidate(s).`);
  }
  candidates.splice(getMaxNewRepositories());
  if (candidates.length === 0) {
    await writeFile(
      enrichedPath,
      `${JSON.stringify({ schema_version: 1, repositories: [] }, null, 2)}\n`,
      "utf8",
    );
    console.log("No candidates to enrich.");
    return;
  }

  const ai = createClient();
  const enriched: Candidate[] = [];
  const { succeeded, failed } = await forEachSafely(
    candidates,
    (candidate) => candidate.id,
    async (candidate) => {
      const fields = await generateAiFields(ai, candidate);
      const validated = repositorySchema.safeParse({
        ...candidate,
        ...fields,
        listing_status: "unreviewed",
        last_reviewed: null,
      });
      if (!validated.success) {
        throw new Error("enriched record failed schema validation");
      }
      enriched.push(validated.data);
    },
  );

  const output = { schema_version: 1, repositories: enriched };
  await writeFile(enrichedPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${enriched.length} enriched candidates to ${enrichedPath}`);
  reportOutcome(succeeded, failed);
}

async function backfillExistingRepositories(): Promise<void> {
  const file = repositoriesFileSchema.parse(
    JSON.parse(await readFile(repositoriesPath, "utf8")),
  );
  const todo = file.repositories.filter((repository) => force || !repository.summary);
  if (todo.length === 0) {
    console.log("Every repository already has an AI summary. Use --force to regenerate.");
    return;
  }
  console.log(`Backfilling ${todo.length} of ${file.repositories.length} repositories.`);

  const ai = createClient();
  const updates = new Map<string, Repository>();
  const { succeeded, failed } = await forEachSafely(
    todo,
    (repository) => repository.id,
    async (repository) => {
      const fields = await generateAiFields(ai, repository);
      // Spread the existing record first so listing_status and last_reviewed are kept.
      const validated = repositorySchema.safeParse({ ...repository, ...fields });
      if (!validated.success) {
        throw new Error("enriched record failed schema validation");
      }
      updates.set(repository.id, validated.data);
    },
  );

  if (updates.size > 0) {
    const output = {
      schema_version: file.schema_version,
      repositories: file.repositories.map(
        (repository) => updates.get(repository.id) ?? repository,
      ),
    };
    await writeFile(repositoriesPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(`Updated ${updates.size} repositories in ${repositoriesPath}`);
  }
  reportOutcome(succeeded, failed);
}

(backfillAll ? backfillExistingRepositories() : enrichNewCandidates()).catch(
  (error: unknown) => {
    console.error("Repository enrichment failed:", error);
    process.exitCode = 1;
  },
);
