"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const DEBOUNCE_MS = 250;

/** Returns the URL with `q` applied; an empty value removes the param. */
function hrefWithQuery(current: { toString(): string }, query: string): string {
  const next = new URLSearchParams(current.toString());
  if (query) {
    next.set("q", query);
  } else {
    next.delete("q");
  }
  const search = next.toString();
  return search ? `/?${search}` : "/";
}

/**
 * Search for the repository list. The URL is the source of truth (?q=): typing
 * updates `q` after a short pause, and category and sort are preserved.
 */
export default function SearchBar({ query }: { query: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(query);

  // "Clear filters" and back/forward change the URL; follow it, but leave the
  // box alone when it only caught up with what was typed.
  const [seenQuery, setSeenQuery] = useState(query);
  if (query !== seenQuery) {
    setSeenQuery(query);
    if (text.trim() !== query.trim()) {
      setText(query);
    }
  }

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === (searchParams.get("q") ?? "").trim()) {
      return;
    }
    const timer = setTimeout(() => {
      router.replace(hrefWithQuery(searchParams, trimmed), { scroll: false });
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
        router.replace(hrefWithQuery(searchParams, text.trim()), { scroll: false });
      }}
    >
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
    </form>
  );
}
