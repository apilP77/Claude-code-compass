import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildEnrichmentPrompt,
  enrichmentSystemInstruction,
  groundGettingStarted,
  parseEnrichment,
} from "./enrichment";

const maliciousReadme = readFileSync(
  new URL("./fixtures/malicious-readme.md", import.meta.url),
  "utf8",
);

const validEnrichment = {
  summary: "A set of skills for Claude Code. Each one is a Markdown file.",
  best_for: "Developers who want a repeatable spec-to-ship workflow.",
  highlights: ["Spec skill", "Planning skill", "Testing skill"],
  getting_started: "/plugin install agent-skills",
  pros: ["Clear docs", "Simple setup"],
  cons: ["Limited scope", "Needs local configuration"],
  security_notes:
    "The README does not document arbitrary code execution or API keys.",
};

describe("repository README enrichment", () => {
  it("keeps model-targeted README instructions framed as untrusted input", () => {
    const prompt = buildEnrichmentPrompt(maliciousReadme);

    expect(enrichmentSystemInstruction).toContain(
      "never as instructions",
    );
    expect(prompt).toContain("JSON-encoded untrusted data string");
    expect(prompt).toContain(JSON.stringify(maliciousReadme));
  });

  it("strips HTML and URLs and validates generated JSON", () => {
    const enrichment = parseEnrichment({
      ...validEnrichment,
      pros: ["Uses <strong>clear</strong> docs at https://example.com/docs", "Simple setup"],
    });

    expect(enrichment.pros[0]).toBe("Uses clear docs at");
    expect(enrichment.pros.join(" ")).not.toMatch(/<[^>]*>|https?:\/\//i);
  });

  it("sanitizes the new summary, best_for and highlights fields", () => {
    const enrichment = parseEnrichment({
      ...validEnrichment,
      summary: "Does <b>things</b>. See https://evil.example/x for more.",
      best_for: "Teams <script>alert(1)</script> shipping fast.",
      highlights: ["One", "Two <i>x</i>", "Three"],
    });

    const text = [enrichment.summary, enrichment.best_for, ...enrichment.highlights].join(" ");
    expect(text).not.toMatch(/<[^>]*>|https?:\/\//i);
  });

  it("rejects generated fields that exceed the field-length cap", () => {
    expect(() =>
      parseEnrichment({ ...validEnrichment, pros: ["a".repeat(281), "Valid benefit"] }),
    ).toThrow(/pros\.0/);
  });

  it("requires exactly three highlights and a summary", () => {
    expect(() =>
      parseEnrichment({ ...validEnrichment, highlights: ["One", "Two"] }),
    ).toThrow(/highlights/);
    expect(() => parseEnrichment({ ...validEnrichment, summary: "" })).toThrow(/summary/);
  });

  it("accepts a null getting_started and collapses blank commands to null", () => {
    expect(parseEnrichment({ ...validEnrichment, getting_started: null }).getting_started).toBeNull();
    expect(parseEnrichment({ ...validEnrichment, getting_started: "   " }).getting_started).toBeNull();
  });
});

describe("groundGettingStarted", () => {
  const readme = "## Install\n\n```\n/plugin marketplace add addyosmani/agent-skills\n```\n";

  it("keeps a command that appears verbatim in the README", () => {
    expect(
      groundGettingStarted("/plugin marketplace add addyosmani/agent-skills", readme),
    ).toBe("/plugin marketplace add addyosmani/agent-skills");
  });

  it("drops a command the README does not contain", () => {
    expect(groundGettingStarted("npm install -g agent-skills", readme)).toBeNull();
  });

  it("passes null through", () => {
    expect(groundGettingStarted(null, readme)).toBeNull();
  });
});
