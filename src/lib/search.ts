import type { Category, Repository } from "./schema";

export type RepositorySort = "name" | "verified" | "last_checked";

export interface SearchOptions {
  query?: string;
  category?: Category;
  verified?: boolean;
  sort?: RepositorySort;
}

function isVerified(repository: Repository): boolean {
  return repository.listing_status === "reviewed";
}

function compareNames(left: Repository, right: Repository): number {
  return left.name.localeCompare(right.name);
}

function compareVerifiedFirst(left: Repository, right: Repository): number {
  return Number(isVerified(right)) - Number(isVerified(left));
}

function compareLastChecked(
  left: Repository,
  right: Repository,
): number {
  if (left.last_reviewed === null) {
    return right.last_reviewed === null ? 0 : 1;
  }
  if (right.last_reviewed === null) {
    return -1;
  }

  return right.last_reviewed.localeCompare(left.last_reviewed);
}

function matchesQuery(repository: Repository, query: string): boolean {
  return [repository.name, repository.description, ...repository.tags].some(
    (value) => value.toLocaleLowerCase().includes(query),
  );
}

export function searchRepositories(
  repositories: readonly Repository[],
  options: SearchOptions = {},
): Repository[] {
  const query = options.query?.trim().toLocaleLowerCase() ?? "";
  const hasFilters =
    query.length > 0 ||
    options.category !== undefined ||
    options.verified !== undefined;

  if (!hasFilters && options.sort === undefined) {
    return [...repositories];
  }

  const filtered = repositories.filter((repository) => {
    if (query && !matchesQuery(repository, query)) {
      return false;
    }
    if (options.category && repository.category !== options.category) {
      return false;
    }
    if (
      options.verified !== undefined &&
      isVerified(repository) !== options.verified
    ) {
      return false;
    }
    return true;
  });

  const sort = options.sort ?? "verified";
  return filtered.sort((left, right) => {
    switch (sort) {
      case "name":
        return compareNames(left, right);
      case "last_checked":
        return compareLastChecked(left, right) || compareNames(left, right);
      case "verified":
        return compareVerifiedFirst(left, right) || compareNames(left, right);
    }
  });
}
