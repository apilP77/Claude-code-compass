import { describe, expect, it } from "vitest";
import type { Repository } from "./schema";
import { searchRepositories } from "./search";

function repository(
  id: string,
  name: string,
  overrides: Partial<Repository> = {},
): Repository {
  const [owner] = id.split("/");
  return {
    id,
    owner,
    name,
    url: `https://github.com/${id}`,
    description: "A sample repository",
    category: "collections",
    tags: [],
    license_spdx: "MIT",
    listing_status: "unreviewed",
    last_reviewed: null,
    stars: null,
    forks: null,
    ...overrides,
  };
}

const repositories = [
  repository("owner/zulu", "Zulu Toolkit", {
    category: "plugins",
    description: "A plugin example",
    tags: ["formatting"],
  }),
  repository("owner/alpha", "Alpha Skills", {
    listing_status: "reviewed",
    last_reviewed: "2025-01-02",
  }),
  repository("owner/mike", "Mike Collection", {
    listing_status: "reviewed",
    last_reviewed: "2025-02-01",
  }),
  repository("owner/bravo", "Bravo Tools", {
    category: "plugins",
    last_reviewed: "2024-12-01",
  }),
];

describe("searchRepositories", () => {
  it("matches text in repository names", () => {
    expect(searchRepositories(repositories, { query: "zulu" })).toEqual([
      repositories[0],
    ]);
  });

  it("matches text in descriptions", () => {
    expect(searchRepositories(repositories, { query: "plugin example" })).toEqual([
      repositories[0],
    ]);
  });

  it("matches text in tags", () => {
    expect(searchRepositories(repositories, { query: "formatting" })).toEqual([
      repositories[0],
    ]);
  });

  it("filters by category", () => {
    expect(searchRepositories(repositories, { category: "plugins" })).toEqual([
      repositories[3],
      repositories[0],
    ]);
  });

  it("combines text and category filters", () => {
    expect(
      searchRepositories(repositories, {
        query: "plugin",
        category: "plugins",
      }),
    ).toEqual([repositories[0]]);
  });

  it("returns an empty result when no repository matches", () => {
    expect(searchRepositories(repositories, { query: "not present" })).toEqual(
      [],
    );
  });

  it("sorts by name A-Z", () => {
    expect(
      searchRepositories(repositories, { sort: "name" }).map((repo) => repo.name),
    ).toEqual(["Alpha Skills", "Bravo Tools", "Mike Collection", "Zulu Toolkit"]);
  });

  it("sorts verified repositories first, then by name", () => {
    expect(
      searchRepositories(repositories, { sort: "verified" }).map((repo) => repo.id),
    ).toEqual(["owner/alpha", "owner/mike", "owner/bravo", "owner/zulu"]);
  });

  it("sorts by last checked descending, with unknown dates last", () => {
    expect(
      searchRepositories(repositories, { sort: "last_checked" }).map((repo) => repo.id),
    ).toEqual(["owner/mike", "owner/alpha", "owner/bravo", "owner/zulu"]);
  });

  it("defaults filtered results to verified-first, then name", () => {
    expect(
      searchRepositories(repositories, { query: "tool" }).map((repo) => repo.id),
    ).toEqual(["owner/bravo", "owner/zulu"]);
  });

  it("returns all repositories in their original order for an empty query", () => {
    const result = searchRepositories(repositories, { query: "" });

    expect(result).toEqual(repositories);
    expect(result).not.toBe(repositories);
  });

  it("filters by verified status", () => {
    expect(
      searchRepositories(repositories, { verified: true }).map((repo) => repo.id),
    ).toEqual(["owner/alpha", "owner/mike"]);
  });
});
