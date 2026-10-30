import { Suspense } from "react";
import Link from "next/link";
import RepoCard from "@/components/RepoCard";
import { repositories } from "@/lib/repos";
import { searchRepositories } from "@/lib/search";
import { CATEGORIES, type Category } from "@/lib/schema";

type HomeProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

function directoryHref(query: string, category?: Category): string {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (category) {
    params.set("category", category);
  }

  const search = params.toString();
  return search ? `/?${search}` : "/";
}

export default function Home({ searchParams }: HomeProps) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading repository directory…
          </p>
        </main>
      }
    >
      <RepositoryDirectory searchParams={searchParams} />
    </Suspense>
  );
}

async function RepositoryDirectory({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = firstValue(params.q);
  const categoryValue = firstValue(params.category);
  const category = isCategory(categoryValue) ? categoryValue : undefined;
  const results = searchRepositories(repositories, { query, category });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-teal-700 uppercase dark:text-teal-300">
            A community-curated directory
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            Claude Code Compass
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Find the right skills, plugins, and tools for your Claude Code
            workflow.
          </p>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            A searchable guide to community-built resources, with clear
            licensing and review status.
          </p>
        </header>

        <section
          className="mx-auto mt-10 max-w-3xl"
          aria-label="Search and filter repositories"
        >
          <form action="/" method="get" role="search" className="flex gap-2">
            <label htmlFor="repository-search" className="sr-only">
              Search repositories
            </label>
            <input
              id="repository-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by name, description, or tag"
              className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm shadow-sm outline-none placeholder:text-zinc-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/20"
            />
            {category && (
              <input type="hidden" name="category" value={category} />
            )}
            <button
              type="submit"
              className="rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:bg-teal-300 dark:text-teal-950 dark:hover:bg-teal-200 dark:focus-visible:outline-teal-300"
            >
              Search
            </button>
          </form>

          <nav
            aria-label="Filter by category"
            className="mt-5 flex flex-wrap justify-center gap-2"
          >
            <Link
              href={directoryHref(query)}
              aria-current={category === undefined ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300 ${
                category === undefined
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              All categories
            </Link>
            {CATEGORIES.map((item) => (
              <Link
                key={item}
                href={directoryHref(query, item)}
                aria-current={category === item ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:focus-visible:outline-teal-300 ${
                  category === item
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
        </section>

        <section className="mt-12" aria-label="Repository directory">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">
              Explore repositories
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {results.length} {results.length === 1 ? "repository" : "repositories"}
            </p>
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
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-lg font-semibold">
                No repos match your search
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                Try a different query or clear your filters.
              </p>
              <Link
                href="/"
                className="mt-5 inline-flex rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 underline underline-offset-4 hover:text-teal-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 dark:text-teal-300 dark:hover:text-teal-200 dark:focus-visible:outline-teal-300"
              >
                Clear filters
              </Link>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-200 px-5 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Independent community project, not an official Anthropic site.
      </footer>
    </div>
  );
}
