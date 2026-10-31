import { describe, expect, it } from "vitest";
import { parseVoteRequest } from "./vote-request";

const knownRepositoryIds = new Set(["owner/repository"]);

describe("parseVoteRequest", () => {
  it("accepts a vote for a repository in the directory", () => {
    expect(
      parseVoteRequest(
        { repositoryId: "owner/repository", voteType: 1 },
        knownRepositoryIds,
      ),
    ).toEqual({ repositoryId: "owner/repository", voteType: 1 });
  });

  it.each([0, 2, "1", null])("rejects invalid vote type %s", (voteType) => {
    expect(
      parseVoteRequest(
        { repositoryId: "owner/repository", voteType },
        knownRepositoryIds,
      ),
    ).toBeNull();
  });

  it("rejects unknown repositories and client-supplied user IDs", () => {
    expect(
      parseVoteRequest(
        { repositoryId: "owner/unknown", voteType: -1 },
        knownRepositoryIds,
      ),
    ).toBeNull();
    expect(
      parseVoteRequest(
        {
          repositoryId: "owner/repository",
          voteType: 1,
          user_id: "attacker-controlled",
        },
        knownRepositoryIds,
      ),
    ).toBeNull();
  });
});
