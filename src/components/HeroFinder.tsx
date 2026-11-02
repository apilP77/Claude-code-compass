"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Compass from "@/components/Compass";
import Contour from "@/components/Contour";
import { bearingFor, bearingToPoint, nearestBearing } from "@/lib/bearing";
import { QUERY_MAX_LENGTH, QUERY_MIN_LENGTH } from "@/lib/skill-set";

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

type HeroFinderProps = {
  query: string;
  resultCount: number;
};

/**
 * The URL is the source of truth (?q=&category=&sort=). Typing updates `q`
 * after a short pause; other params (category, sort) are preserved. Sorting
 * lives next to the list, in SortSelect.
 */
export default function HeroFinder({ query, resultCount }: HeroFinderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [text, setText] = useState(query);
  const [armed, setArmed] = useState(false);
  const [pointerBearing, setPointerBearing] = useState<number | null>(null);
  const compassRef = useRef<SVGSVGElement>(null);
  const lastBearing = useRef(START_BEARING);

  // Let the first paint show the needle off-north, then swing it to its bearing.
  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // While the search box is empty, the needle follows the pointer. People who
  // ask for reduced motion keep a still needle.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      return;
    }
    let frame = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = compassRef.current?.getBoundingClientRect();
        if (!box || box.width === 0) {
          return;
        }
        const raw = bearingToPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
          event.clientX,
          event.clientY,
        );
        const next = nearestBearing(lastBearing.current, raw);
        lastBearing.current = next;
        setPointerBearing(next);
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
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
  const following = text.trim() === "" && pointerBearing !== null;
  const bearing = !armed
    ? START_BEARING
    : following
      ? pointerBearing
      : bearingFor(text);

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
            Every entry shows its license and a plain-English summary, and
            editor&rsquo;s picks are marked.
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
            className="mt-8 max-w-2xl"
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
          ref={compassRef}
          bearing={bearing}
          tracking={following}
          lost={lost}
          className="hidden h-40 w-40 justify-self-center md:block"
        />
      </div>
    </section>
  );
}
