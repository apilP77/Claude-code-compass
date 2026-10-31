import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  repositoriesFileSchema,
  type Repository,
} from "../src/lib/schema";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoriesPath = resolve(projectRoot, "data/repos.json");
const enrichedPath = resolve(projectRoot, "data/enriched.json");

async function readRepositoriesFile(path: string) {
  const contents = await readFile(path, "utf8");
  const parsed: unknown = JSON.parse(contents);
  return repositoriesFileSchema.parse(parsed);
}

async function main(): Promise<void> {
  const [repositoriesFile, enrichedFile] = await Promise.all([
    readRepositoriesFile(repositoriesPath),
    readRepositoriesFile(enrichedPath),
  ]);

  const repositoriesById = new Map<string, Repository>(
    repositoriesFile.repositories.map((repository) => [
      repository.id,
      repository,
    ]),
  );
  let mergedCount = 0;

  for (const repository of enrichedFile.repositories) {
    if (repositoriesById.has(repository.id)) {
      continue;
    }

    repositoriesById.set(repository.id, repository);
    mergedCount += 1;
  }

  const repositories = [...repositoriesById.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const mergedFile = {
    schema_version: repositoriesFile.schema_version,
    repositories,
  };
  const clearedEnrichedFile = {
    schema_version: enrichedFile.schema_version,
    repositories: [],
  };

  await writeFile(
    repositoriesPath,
    `${JSON.stringify(mergedFile, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    enrichedPath,
    `${JSON.stringify(clearedEnrichedFile, null, 2)}\n`,
    "utf8",
  );

  console.log(`Successfully merged ${mergedCount} new repositories.`);
}

main().catch((error: unknown) => {
  console.error("Repository merge failed:", error);
  process.exitCode = 1;
});
