import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildEnrichmentPrompt,
  enrichmentSystemInstruction,
  parseEnrichment,
} from "./enrichment";

const maliciousReadme = readFileSync(
  new URL("./fixtures/malicious-readme.md", import.meta.url),
  "utf8",
);

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
      pros: ["Uses <strong>clear</strong> docs at https://example.com/docs", "Simple setup"],
      cons: ["Limited scope", "Needs local configuration"],
      security_notes:
        "The README does not document arbitrary code execution or API keys.",
    });

    expect(enrichment.pros[0]).toBe("Uses clear docs at");
    expect(enrichment.pros.join(" ")).not.toMatch(/<[^>]*>|https?:\/\//i);
  });

  it("rejects generated fields that exceed the field-length cap", () => {
    expect(() =>
      parseEnrichment({
        pros: ["a".repeat(281), "Valid benefit"],
        cons: ["A limitation", "Another limitation"],
        security_notes:
          "The README does not document arbitrary code execution or API keys.",
      }),
    ).toThrow(/pros\.0/);
  });
});
