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

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const candidatesPath = resolve(projectRoot, "data/candidates.json");
const enrichedPath = resolve(projectRoot, "data/enriched.json");

config({ path: resolve(projectRoot, ".env.local") });

type Candidate = Record<string, unknown> & {
  owner: string;
  name: string;
};

const geminiTimeoutMs = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCandidate(value: unknown): value is Candidate {
  return (
    isRecord(value) &&
    typeof value.owner === "string" &&
    typeof value.name === "string"
  );
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
): Promise<Candidate | null> {
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
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: enrichmentResponseJsonSchema,
          systemInstruction: enrichmentSystemInstruction,
        },
      });
    } catch (error) {
      const status =
        isRecord(error) && typeof error.status === "number"
          ? error.status
          : undefined;
      const isTimeout =
        error instanceof Error &&
        /timeout|timed out/i.test(`${error.name} ${error.message}`);

      if (status === 503 || isTimeout) {
        console.warn(
          `Skipping ${candidate.owner}/${candidate.name} due to API timeout`,
        );
        return null;
      }

      throw error;
    }
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
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is missing. Add it to the project root .env.local file.",
    );
  }

  const contents = await readFile(candidatesPath, "utf8");
  const input: unknown = JSON.parse(contents);
  if (!isRecord(input) || !Array.isArray(input.repositories)) {
    throw new Error(`${candidatesPath} has an invalid repositories file shape.`);
  }

  const repositoryRecords: unknown[] = input.repositories;
  const candidates = repositoryRecords.slice(0, 3);
  if (!candidates.every(isCandidate)) {
    throw new Error(`${candidatesPath} contains a candidate with no owner or name.`);
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
    if (result) {
      enriched.push(result);
    }
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
