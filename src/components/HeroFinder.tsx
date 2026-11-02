"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Compass from "@/components/Compass";
import Contour from "@/components/Contour";
import { REPOSITORY_SORTS, type RepositorySort } from "@/lib/search";
import { QUERY_MAX_LENGTH, QUERY_MIN_LENGTH } from "@/lib/skill-set";

const SORT_LABELS: Record<RepositorySort, string> = {
  verified: "Reviewed first",
  stars: "Most stars",
  newest: "Recently added",
  name: "Name (A–Z)",
  last_checked: "Recently reviewed",
};

const DEBOUNCE_MS = 250;
/** Where the needle starts before it swings to north on first load. */
const START_BEARING = 150;

/** Returns the URL with `changes` applied; empty values remove the param. */
function hrefWith(
  current: { toString(): string },
  changes: Record<string, string>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(changes)) {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  }
  const search = next.toString();
  return search ? `/?${search}` : "/";
}

/** A stable bearing from the text: the same query always points the same way. */
function bearingFor(text: string): number {
  const query = text.trim().toLowerCase();
  if (query === "") {
    return 0;
  }
  let hash = 0;
  for (const char of query) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  }
  return (hash % 141) - 70;
}

type HeroFinderProps = {
  query: string;
  sort: RepositorySort;
  resultCount: number;
};

/**
 * The URL is the source of truth (?q=&category=&sort=). This writes to it:
 * typing updates `q` after a short pause, the select updates `sort`
 * immediately, and other params (category) are preserved.
 */
export default function HeroFinder({ query, sort, resultCount }: HeroFinderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(query);
  const [armed, setArmed] = useState(false);

  // Let the first paint show the needle off-north, then swing it to its bearing.
  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === (searchParams.get("q") ?? "").trim()) {
      return;
    }
    const timer = setTimeout(() => {
      router.replace(hrefWith(searchParams, { q: trimmed }), { scroll: false });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, searchParams, router]);

  const lost = resultCount === 0 && query.trim() !== "";

  return (
    <section className="relative overflow-hidden border-b border-line bg-[radial-gradient(ellipse_at_78%_48%,var(--c-glow),transparent_58%)]">
      <Contour />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <h1 className="display max-w-[16ch] text-4xl sm:text-5xl">
            Find your way through Claude Code tools
          </h1>
          <p className="mt-4 max-w-[60ch] text-base text-muted">
            A directory of community-built skills, plugins and collections.
            Every entry shows its license, whether anyone has reviewed it, and
            a plain-English summary.
          </p>

          <form
            action="/"
            method="get"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              router.replace(hrefWith(searchParams, { q: text.trim() }), {
                scroll: false,
              });
            }}
            className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="repository-search" className="sr-only">
                Search repositories
              </label>
              <input
                id="repository-search"
                name="q"
                type="search"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Search skills, plugins, collections"
                autoComplete="off"
                className="h-12 w-full rounded-md border border-line-strong bg-surface px-4 text-base text-fg outline-none transition-colors placeholder:text-faint hover:border-ink focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="repository-sort" className="text-sm text-faint">
                Sort
              </label>
              <select
                id="repository-sort"
                name="sort"
                value={sort}
                onChange={(event) =>
                  router.replace(
                    hrefWith(searchParams, { sort: event.target.value }),
                    { scroll: false },
                  )
                }
                className="h-12 rounded-md border border-line-strong bg-surface px-3 text-sm text-fg outline-none transition-colors hover:border-ink focus:border-accent"
              >
                {REPOSITORY_SORTS.map((value) => (
                  <option key={value} value={value}>
                    {SORT_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <form
            action="/skill-set"
            method="get"
            className="mt-6 max-w-2xl rounded-[10px] border border-accent/60 bg-surface p-4 shadow-sm sm:p-5"
          >
            <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">
              New · Skill set finder
            </p>
            <label htmlFor="hero-project" className="display mt-1 block text-xl">
              Building something? Get a whole skill set.
            </label>
            <p className="mt-1 text-sm text-muted">
              Describe your project and get a short list of skills that work
              together, with install commands.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="hero-project"
                name="q"
                type="text"
                required
                minLength={QUERY_MIN_LENGTH}
                maxLength={QUERY_MAX_LENGTH}
                autoComplete="off"
                placeholder="A Next.js SaaS with Stripe and Supabase"
                className="h-12 min-w-0 rounded-md border border-line-strong bg-bg sm:flex-1 px-4 text-base text-fg outline-none transition-colors placeholder:text-faint hover:border-ink focus:border-accent"
              />
              <button
                type="submit"
                className="h-12 rounded-md bg-accent px-5 text-sm font-semibold text-bg transition-colors hover:bg-ink"
              >
                Find my skill set
              </button>
            </div>
          </form>
        </div>

        <Compass
          bearing={armed ? bearingFor(text) : START_BEARING}
          lost={lost}
          className="hidden h-40 w-40 justify-self-center md:block"
        />
      </div>
    </section>
  );
}
