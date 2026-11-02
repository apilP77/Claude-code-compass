"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { REPOSITORY_SORTS, type RepositorySort } from "@/lib/search";

const SORT_LABELS: Record<RepositorySort, string> = {
  verified: "Verified first",
  stars: "Most stars",
  newest: "Recently added",
  name: "Name (A–Z)",
  last_checked: "Recently reviewed",
};

const DEBOUNCE_MS = 250;

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

type SearchControlsProps = {
  query: string;
  sort: RepositorySort;
};

/**
 * The URL is the source of truth (?q=&category=&sort=). This component only
 * writes to it: typing updates `q` after a short pause, the select updates
 * `sort` immediately, and other params (category) are preserved.
 */
export default function SearchControls({ query, sort }: SearchControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(query);

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

  return (
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
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="relative min-w-0 flex-1">
        <label htmlFor="repository-search" className="sr-only">
          Search repositories
        </label>
        <input
          id="repository-search"
          name="q"
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search skills, plugins, tools…"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-line bg-surface px-4 text-[15px] text-fg outline-none transition-colors placeholder:text-faint hover:border-line-strong focus:border-accent"
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
            router.replace(hrefWith(searchParams, { sort: event.target.value }), {
              scroll: false,
            })
          }
          className="h-11 rounded-lg border border-line bg-surface px-3 text-sm text-fg outline-none transition-colors hover:border-line-strong focus:border-accent"
        >
          {REPOSITORY_SORTS.map((value) => (
            <option key={value} value={value}>
              {SORT_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
