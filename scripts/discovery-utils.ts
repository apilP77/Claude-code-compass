import { z } from "zod";
import type { Repository } from "../src/lib/schema";

const maxNewRepositoriesSchema = z.coerce.number().int().safe();

export function getMaxNewRepositories(
  value: string | undefined = process.env.MAX_NEW_REPOS,
): number {
  const parsed = maxNewRepositoriesSchema.parse(value ?? "2");
  return Math.max(1, Math.min(5, parsed));
}

export function mergeNewRepositories(
  existing: Repository[],
  incoming: Repository[],
  maximum: number,
): { repositories: Repository[]; added: Repository[] } {
  const repositoriesById = new Map(
    existing.map((repository) => [repository.id, repository]),
  );
  const added: Repository[] = [];

  for (const repository of incoming) {
    if (repositoriesById.has(repository.id) || added.length >= maximum) {
      continue;
    }

    const unreviewedRepository: Repository = {
      ...repository,
      listing_status: "unreviewed",
      last_reviewed: null,
    };
    repositoriesById.set(unreviewedRepository.id, unreviewedRepository);
    added.push(unreviewedRepository);
  }

  return {
    repositories: [...repositoriesById.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    added,
  };
}
