import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildEnrichmentPrompt,
  enrichmentResponseJsonSchema,
  enrichmentSystemInstruction,
  parseEnrichment,
} from "../src/lib/enrichment";
import {
  repositorySchema,
  type Repository,
} from "../src/lib/schema";
import { getMaxNewRepositories } from "./discovery-utils";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidatesPath = resolve(projectRoot, "data/candidates.json");
const enrichedPath = resolve(projectRoot, "data/enriched.json");

config({ path: resolve(projectRoot, ".env.local") });

type Candidate = Repository;

const geminiTimeoutMs = 15_000;

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

async function enrichCandidate(
  ai: GoogleGenAI,
  candidate: Candidate,
): Promise<Candidate> {
  const readme = await fetchReadme(candidate);
  if (!readme.trim()) {
    throw new Error(`README for ${candidate.owner}/${candidate.name} is empty.`);
  }

  const contents = buildEnrichmentPrompt(readme);

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: enrichmentResponseJsonSchema,
        systemInstruction: enrichmentSystemInstruction,
      },
    });
  } catch {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: enrichmentResponseJsonSchema,
        systemInstruction: enrichmentSystemInstruction,
      },
    });
  }

  if (!response.text) {
    throw new Error(`Gemini returned an empty response for ${candidate.owner}/${candidate.name}.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch (error) {
    throw new Error(
      `Gemini returned invalid JSON for ${candidate.owner}/${candidate.name}.`,
      { cause: error },
    );
  }

  const enrichment = parseEnrichment(parsed);
  return {
    ...candidate,
    ...enrichment,
    listing_status: "unreviewed",
    last_reviewed: null,
  };
}

async function main(): Promise<void> {
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

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to the project root .env.local file.",
    );
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: geminiTimeoutMs,
      retryOptions: { attempts: 1 },
    },
  });
  const enriched: Candidate[] = [];
  for (const candidate of candidates) {
    const result = await enrichCandidate(ai, candidate);
    const validated = repositorySchema.safeParse(result);
    if (!validated.success) {
      console.warn(
        `Skipped invalid enriched repository ${candidate.owner}/${candidate.name}.`,
      );
      continue;
    }
    enriched.push(validated.data);
  }

  const output = {
    schema_version: 1,
    repositories: enriched,
  };
  await writeFile(enrichedPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${enriched.length} enriched candidates to ${enrichedPath}`);
}

main().catch((error: unknown) => {
  console.error("Candidate enrichment failed:", error);
  process.exitCode = 1;
});
