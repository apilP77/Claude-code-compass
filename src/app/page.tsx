import { Suspense } from "react";
import Link from "next/link";
import RepoCard from "@/components/RepoCard";
import SearchControls from "@/components/SearchControls";
import { repositories } from "@/lib/repos";
import {
  REPOSITORY_SORTS,
  searchRepositories,
  type RepositorySort,
} from "@/lib/search";
import { CATEGORIES, type Category } from "@/lib/schema";

type HomeProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    sort?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

function isSort(value: string): value is RepositorySort {
  return REPOSITORY_SORTS.some((sort) => sort === value);
}

function directoryHref(
  query: string,
  sort: RepositorySort,
  category?: Category,
): string {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (category) {
    params.set("category", category);
  }
  if (sort !== "verified") {
    params.set("sort", sort);
  }

  const search = params.toString();
  return search ? `/?${search}` : "/";
}

const chipBase =
  "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium capitalize transition-colors";
const chipOff =
  "border-line text-muted hover:border-line-strong hover:text-fg";
const chipOn = "border-accent/40 bg-accent/10 text-accent";

function DirectorySkeleton() {
  return (
    <ul
      aria-label="Loading repositories"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <li
          key={index}
          className="h-56 animate-pulse rounded-xl border border-line bg-surface"
        />
      ))}
    </ul>
  );
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-[40px] sm:leading-[48px]">
          Find the right tools for Claude Code
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">
          A searchable directory of community-built skills, plugins and
          collections, with licenses, review status and plain-English summaries.
        </p>
      </header>

      <Suspense fallback={<div className="mt-8"><DirectorySkeleton /></div>}>
        <RepositoryDirectory searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function RepositoryDirectory({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = firstValue(params.q);
  const categoryValue = firstValue(params.category);
  const sortValue = firstValue(params.sort);
  const category = isCategory(categoryValue) ? categoryValue : undefined;
  const sort = isSort(sortValue) ? sortValue : "verified";
  const results = searchRepositories(repositories, { query, category, sort });
  const filtered = query !== "" || category !== undefined;

  return (
    <>
      <section
        className="mt-8 flex flex-col gap-4"
        aria-label="Search and filter repositories"
      >
        <SearchControls query={query} sort={sort} />

        <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
          <Link
            href={directoryHref(query, sort)}
            aria-current={category === undefined ? "page" : undefined}
            className={`${chipBase} ${category === undefined ? chipOn : chipOff}`}
          >
            All
          </Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item}
              href={directoryHref(query, sort, item)}
              aria-current={category === item ? "page" : undefined}
              className={`${chipBase} ${category === item ? chipOn : chipOff}`}
            >
              {item}
            </Link>
          ))}
        </nav>
      </section>

      <section className="mt-8" aria-label="Repository directory">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p aria-live="polite" className="text-sm text-faint">
            {results.length}{" "}
            {results.length === 1 ? "repository" : "repositories"}
            {filtered && " match"}
          </p>
          {filtered && (
            <Link
              href={directoryHref("", sort)}
              className="rounded-lg px-2 py-1 text-sm text-accent underline-offset-4 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>

        {results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((repository) => (
              <li key={repository.id}>
                <RepoCard repository={repository} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
            <p className="text-lg font-semibold">
              {query ? `No repositories match “${query}”` : "Nothing here yet"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Try a different word, or clear the filters to see everything.
            </p>
            <Link
              href={directoryHref("", sort)}
              className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-line px-4 text-sm font-medium text-fg transition-colors hover:border-line-strong hover:bg-surface-2"
            >
              Clear filters
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
