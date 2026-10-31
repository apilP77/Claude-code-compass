import { z } from "zod";

const voteRequestSchema = z.strictObject({
  repositoryId: z.string().min(1).max(201),
  voteType: z.union([z.literal(1), z.literal(-1)]),
});

export type VoteRequest = z.infer<typeof voteRequestSchema>;

export function parseVoteRequest(
  value: unknown,
  knownRepositoryIds: ReadonlySet<string>,
): VoteRequest | null {
  const parsed = voteRequestSchema.safeParse(value);
  if (!parsed.success || !knownRepositoryIds.has(parsed.data.repositoryId)) {
    return null;
  }

  return parsed.data;
}
