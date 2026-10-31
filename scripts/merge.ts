import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import {
  repositoriesFileSchema,
  type Repository,
} from "../src/lib/schema";
import {
  getMaxNewRepositories,
  mergeNewRepositories,
} from "./discovery-utils";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoriesPath = resolve(projectRoot, "data/repos.json");
const enrichedPath = resolve(projectRoot, "data/enriched.json");
const discoveryRunsPath = resolve(projectRoot, "data/discovery-runs");

async function readRepositoriesFile(path: string) {
  const contents = await readFile(path, "utf8");
  const parsed: unknown = JSON.parse(contents);
  return repositoriesFileSchema.parse(parsed);
}

async function writeGitHubOutputs(added: Repository[]): Promise<void> {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    return;
  }

  const body = [
    ...added.map(
      (repository) =>
        `- **${repository.id}** — ${repository.url} — License: ${repository.license_spdx ?? "unknown"}`,
    ),
    "",
    "Auto-discovered, not yet reviewed. Review the AI notes before merging.",
  ].join("\n");
  const delimiter = `DISCOVERY_BODY_${randomUUID()}`;
  await appendFile(
    outputPath,
    `new_count=${added.length}\npr_body<<${delimiter}\n${body}\n${delimiter}\n`,
    "utf8",
  );
}

async function main(): Promise<void> {
  const [repositoriesFile, enrichedFile] = await Promise.all([
    readRepositoriesFile(repositoriesPath),
    readRepositoriesFile(enrichedPath),
  ]);

  const { repositories, added } = mergeNewRepositories(
    repositoriesFile.repositories,
    enrichedFile.repositories,
    getMaxNewRepositories(),
  );
  const mergedFile = {
    schema_version: repositoriesFile.schema_version,
    repositories,
  };
  const clearedEnrichedFile = {
    schema_version: enrichedFile.schema_version,
    repositories: [],
  };

  if (added.length > 0) {
    await writeFile(
      repositoriesPath,
      `${JSON.stringify(mergedFile, null, 2)}\n`,
      "utf8",
    );
    const completedAt = new Date();
    const runPath = resolve(
      discoveryRunsPath,
      `${completedAt.toISOString().replace(/[:.]/g, "-")}.json`,
    );
    await mkdir(discoveryRunsPath, { recursive: true });
    await writeFile(
      runPath,
      `${JSON.stringify(
        {
          schema_version: 1,
          status: "success",
          completed_at: completedAt.toISOString(),
          repositories: added.map((repository) => ({
            id: repository.id,
            stars: repository.stars,
            forks: repository.forks,
          })),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
  }
  await writeFile(
    enrichedPath,
    `${JSON.stringify(clearedEnrichedFile, null, 2)}\n`,
    "utf8",
  );

  if (added.length === 0) {
    console.log("No new repositories today");
  } else {
    console.log(`Successfully merged ${added.length} new repositories.`);
  }
  await writeGitHubOutputs(added);
}

main().catch((error: unknown) => {
  console.error("Repository merge failed:", error);
  process.exitCode = 1;
});
