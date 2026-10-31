import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const searchTerms = [
  "claude code skill",
  "claude code plugin",
  "claude plugins",
  "mcp server",
];
const junkRepositoryName = /(?:^|[-_.])(test|dotfiles|my-config|hello-world)(?:$|[-_.])/i;

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoriesPath = resolve(projectRoot, "data/repos.json");
const candidatesPath = resolve(projectRoot, "data/candidates.json");

config({ path: resolve(projectRoot, ".env.local") });

type GitHubRepository = {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  fork: boolean;
  topics?: string[];
  license?: { spdx_id: string | null } | null;
  stargazers_count: number;
  forks_count: number;
};

type Candidate = {
  id: string;
  owner: string;
  name: string;
  url: string;
  description: string;
  category: "skills" | "plugins" | "collections" | "directories";
  tags: string[];
  license_spdx: string | null;
  listing_status: "unreviewed";
  last_reviewed: null;
  stars: number;
  forks: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGitHubRepository(value: unknown): value is GitHubRepository {
  return (
    isRecord(value) &&
    typeof value.full_name === "string" &&
    typeof value.name === "string" &&
    isRecord(value.owner) &&
    typeof value.owner.login === "string" &&
    typeof value.html_url === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    typeof value.fork === "boolean" &&
    (value.topics === undefined ||
      (Array.isArray(value.topics) &&
        value.topics.every((topic) => typeof topic === "string"))) &&
    (value.license === undefined ||
      value.license === null ||
      (isRecord(value.license) &&
        (typeof value.license.spdx_id === "string" ||
          value.license.spdx_id === null))) &&
    typeof value.stargazers_count === "number" &&
    typeof value.forks_count === "number"
  );
}

function categoryFor(
  repository: GitHubRepository,
  searchTerm: string,
): Candidate["category"] {
  const text = `${repository.name} ${repository.description ?? ""} ${(repository.topics ?? []).join(" ")}`;

  if (/\bskills?\b/i.test(text)) {
    return "skills";
  }
  if (/\bplugins?\b/i.test(text)) {
    return "plugins";
  }
  if (/\b(collection|awesome|marketplace)\b/i.test(text)) {
    return "collections";
  }
  if (/\b(directory|directories)\b/i.test(text)) {
    return "directories";
  }
  if (searchTerm.includes("skill")) {
    return "skills";
  }
  if (searchTerm.includes("plugin") || searchTerm.includes("mcp server")) {
    return "plugins";
  }
  return "directories";
}

async function readExistingRepositoryIds(): Promise<Set<string>> {
  const contents = await readFile(repositoriesPath, "utf8");
  const parsed: unknown = JSON.parse(contents);

  if (!isRecord(parsed) || !Array.isArray(parsed.repositories)) {
    throw new Error(`${repositoriesPath} has an invalid repositories file shape.`);
  }

  const repositories: unknown[] = parsed.repositories;
  const ids = new Set<string>();
  for (const repository of repositories) {
    if (!isRecord(repository) || typeof repository.id !== "string") {
      throw new Error(
        `${repositoriesPath} has an invalid repositories file shape.`,
      );
    }
    ids.add(repository.id.toLowerCase());
  }
  return ids;
}

async function searchRepositories(
  searchTerm: string,
): Promise<GitHubRepository[]> {
  const url = new URL("https://api.github.com/search/repositories");
  url.search = new URLSearchParams({
    q: `${searchTerm} stars:>5 pushed:>2026-05-01`,
    per_page: "100",
  }).toString();

  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is missing. Add a valid token to the project root .env.local file.",
    );
  }

  console.log(`GitHub token length: ${token.length}`);
  const fetchWithAuthorization = (scheme: "Bearer" | "token") =>
    fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Claude-Code-Compass",
        Authorization: `${scheme} ${token}`,
      },
    });

  const initialScheme = token.startsWith("github_pat_") ? "Bearer" : "token";
  let response = await fetchWithAuthorization(initialScheme);
  if (response.status === 401) {
    response = await fetchWithAuthorization(
      initialScheme === "Bearer" ? "token" : "Bearer",
    );
  }

  if (!response.ok) {
    throw new Error(
      `GitHub search for "${searchTerm}" failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.items)) {
    throw new Error(`GitHub returned an invalid response for "${searchTerm}".`);
  }

  const searchItems: unknown[] = payload.items;
  const items = searchItems.filter(isGitHubRepository);
  if (items.length !== searchItems.length) {
    throw new Error(`GitHub returned an invalid repository for "${searchTerm}".`);
  }
  return items;
}

async function main(): Promise<void> {
  const knownIds = await readExistingRepositoryIds();
  const candidates = new Map<string, Candidate>();

  for (const searchTerm of searchTerms) {
    const results = await searchRepositories(searchTerm);

    for (const repository of results) {
      const id = repository.full_name.toLowerCase();
      const description = repository.description?.trim();

      if (
        repository.fork ||
        !description ||
        description.length < 20 ||
        junkRepositoryName.test(repository.name) ||
        knownIds.has(id) ||
        candidates.has(id)
      ) {
        continue;
      }

      candidates.set(id, {
        id,
        owner: repository.owner.login,
        name: repository.name,
        url: repository.html_url,
        description: description.slice(0, 280),
        category: categoryFor(repository, searchTerm),
        tags: (repository.topics ?? []).filter((topic) => topic.trim().length > 0),
        license_spdx:
          repository.license?.spdx_id &&
          repository.license.spdx_id !== "NOASSERTION"
            ? repository.license.spdx_id
            : null,
        listing_status: "unreviewed",
        last_reviewed: null,
        stars: repository.stargazers_count,
        forks: repository.forks_count,
      });
    }
  }

  const output = {
    schema_version: 1,
    repositories: [...candidates.values()],
  };
  await writeFile(candidatesPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${candidates.size} candidates to ${candidatesPath}`);
}

main().catch((error: unknown) => {
  console.error("Repository discovery failed:", error);
  process.exitCode = 1;
});
