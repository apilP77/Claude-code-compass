import { describe, expect, it } from "vitest";
import type { Repository } from "../src/lib/schema";
import {
  getMaxNewRepositories,
  mergeNewRepositories,
} from "./discovery-utils";

function repository(id: string): Repository {
  const [owner, name] = id.split("/");
  return {
    id,
    owner: owner!,
    name: name!,
    url: `https://github.com/${id}`,
    description: "A sample repository",
    category: "plugins",
    tags: [],
    license_spdx: null,
    stars: 0,
    forks: 0,
    listing_status: "unreviewed",
    last_reviewed: null,
  };
}

describe("nightly discovery limits", () => {
  it("defaults to two and clamps valid integers to the 1-5 range", () => {
    expect(getMaxNewRepositories(undefined)).toBe(2);
    expect(getMaxNewRepositories("0")).toBe(1);
    expect(getMaxNewRepositories("9")).toBe(5);
    expect(getMaxNewRepositories("4")).toBe(4);
    expect(() => getMaxNewRepositories("invalid")).toThrow();
  });

  it("adds at most two repositories even when more are enriched", () => {
    const result = mergeNewRepositories(
      [],
      [
        repository("owner/alpha"),
        repository("owner/bravo"),
        repository("owner/charlie"),
      ],
      getMaxNewRepositories(undefined),
    );

    expect(result.added.map(({ id }) => id)).toEqual([
      "owner/alpha",
      "owner/bravo",
    ]);
    expect(result.repositories).toHaveLength(2);
    expect(result.added.every(({ listing_status }) => listing_status === "unreviewed")).toBe(true);
  });

  it("returns no new entries for an empty or entirely duplicate candidate list", () => {
    const existing = [repository("owner/known")];
    const duplicates = mergeNewRepositories(
      existing,
      [repository("owner/known")],
      2,
    );

    expect(mergeNewRepositories(existing, [], 2).added).toEqual([]);
    expect(duplicates.added).toEqual([]);
    expect(duplicates.repositories).toEqual(existing);
    expect(mergeNewRepositories(existing, [], 2).repositories).toEqual(existing);
  });
});
