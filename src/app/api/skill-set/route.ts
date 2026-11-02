import { GoogleGenAI } from "@google/genai";
import { repositories } from "@/lib/repos";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  buildSkillSetPrompt,
  keywordPicks,
  parseQuery,
  parseSkillSet,
  skillSetResponseJsonSchema,
  skillSetSystemInstruction,
  toEntries,
  type SkillSetResult,
} from "@/lib/skill-set";

export const maxDuration = 30;

const knownIds = new Set(repositories.map((repository) => repository.id));
const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

// Per visitor: a few requests a minute. Best effort on serverless (see rate-limit.ts).
const allowRequest = createRateLimiter(6, 60_000);

// Identical questions reuse an answer for a while instead of spending API quota.
const CACHE_TTL_MS = 10 * 60_000;
const CACHE_MAX_ENTRIES = 200;
const cache = new Map<string, { at: number; result: SkillSetResult }>();

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

function visitorKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function askGemini(query: string): Promise<SkillSetResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 15_000, retryOptions: { attempts: 1 } },
  });
  const response = await ai.models.generateContent({
    model,
    contents: buildSkillSetPrompt(query, repositories),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: skillSetResponseJsonSchema,
      systemInstruction: skillSetSystemInstruction,
    },
  });
  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  const picks = parseSkillSet(JSON.parse(response.text), knownIds);
  return { source: "ai", picks: toEntries(picks, repositories) };
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return errorResponse("Cross-origin requests are not allowed.", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return errorResponse("Content-Type must be application/json.", 415);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const query = parseQuery(
    typeof body === "object" && body !== null && "query" in body ? body.query : undefined,
  );
  if (!query) {
    return errorResponse("Describe your project in 6 to 400 characters.", 400);
  }

  if (!allowRequest(visitorKey(request))) {
    return errorResponse("Too many requests. Try again in a minute.", 429, {
      "Retry-After": "60",
    });
  }

  const cacheKey = query.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return Response.json(cached.result);
  }

  let result: SkillSetResult;
  try {
    result = await askGemini(query);
  } catch (error) {
    // Missing key, quota, timeout or a bad answer: fall back to keyword matching.
    console.warn(
      "Skill set AI unavailable, using keyword matching:",
      error instanceof Error ? error.message : error,
    );
    result = { source: "keywords", picks: toEntries(keywordPicks(query, repositories), repositories) };
  }

  // Only remember AI answers; a fallback should be retried once the AI is back.
  if (result.source === "ai") {
    if (cache.size >= CACHE_MAX_ENTRIES) {
      cache.delete(cache.keys().next().value as string);
    }
    cache.set(cacheKey, { at: Date.now(), result });
  }

  return Response.json(result);
}
