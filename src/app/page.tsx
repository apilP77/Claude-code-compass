import { Suspense, ViewTransition } from "react";
import Link from "next/link";
import CategorySymbol from "@/components/CategorySymbol";
import FeaturedEntry from "@/components/FeaturedEntry";
import HeroFinder from "@/components/HeroFinder";
import RepoRow from "@/components/RepoRow";
import SortSelect from "@/components/SortSelect";
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

const CATEGORY_LABELS: Record<Category, string> = {
  skills: "Skills",
  plugins: "Plugins",
  collections: "Collections",
  directories: "Directories",
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

const categoryCounts = CATEGORIES.reduce(
  (counts, category) => ({
    ...counts,
    [category]: repositories.filter((repo) => repo.category === category).length,
  }),
  {} as Record<Category, number>,
);

const legendBase =
  "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors";
const legendOff = "border-line-strong text-fg hover:border-ink hover:bg-surface";
const legendOn = "border-ink bg-ink text-bg";

function DirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading repositories">
      <div className="h-80 border-b border-line bg-surface-2" />
      <div className="mx-auto mt-8 w-full max-w-6xl space-y-px px-5 sm:px-8">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded bg-surface" />
        ))}
      </div>
    </div>
  );
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <main className="flex-1">
      <Suspense
        fallback={
          <ViewTransition exit="slide-down" default="none">
            <DirectorySkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="slide-up" default="none">
          <RepositoryDirectory searchParams={searchParams} />
        </ViewTransition>
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
  const featured = filtered
    ? []
    : searchRepositories(repositories, { sort: "stars" }).slice(0, 3);

  return (
    <>
      <HeroFinder query={query} resultCount={results.length} />

      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <nav aria-label="Filter by category" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-faint">Legend</span>
          <Link
            href={directoryHref(query, sort)}
            aria-current={category === undefined ? "page" : undefined}
            className={`${legendBase} ${category === undefined ? legendOn : legendOff}`}
          >
            All
            <span className="opacity-70">{repositories.length}</span>
          </Link>
          {CATEGORIES.map((item) => (
            <Link
              key={item}
              href={directoryHref(query, sort, item)}
              aria-current={category === item ? "page" : undefined}
              className={`${legendBase} ${category === item ? legendOn : legendOff}`}
            >
              <CategorySymbol category={item} />
              {CATEGORY_LABELS[item]}
              <span className="opacity-70">{categoryCounts[item]}</span>
            </Link>
          ))}
        </nav>

        {featured.length > 0 && (
          <section className="mt-10" aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="display text-2xl">
              Most starred
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-3">
              {featured.map((repository) => (
                <li key={repository.id}>
                  <FeaturedEntry repository={repository} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section
          className="mt-10"
          aria-labelledby="index-heading"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="index-heading" className="display text-2xl">
              {filtered ? "Results" : "All repositories"}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <SortSelect sort={sort} />
              <p aria-live="polite" className="text-sm text-faint">
                {results.length}{" "}
                {results.length === 1 ? "repository" : "repositories"}
                {filtered && " match"}
              </p>
              {filtered && (
                <Link
                  href={directoryHref("", sort)}
                  className="rounded text-sm font-medium text-accent underline underline-offset-4"
                >
                  Clear filters
                </Link>
              )}
            </div>
          </div>

          {results.length > 0 ? (
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-[10px] border border-line-strong bg-surface">
              {results.map((repository) => (
                <li key={repository.id}>
                  <RepoRow repository={repository} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
              <p className="display text-xl">
                {query ? `Nothing matches “${query}”` : "Nothing in this category yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
                Try a shorter or different word, or clear the filters to see
                every repository.
              </p>
              <Link
                href={directoryHref("", sort)}
                className="mt-6 inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-bg transition-colors hover:bg-accent"
              >
                Clear filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
