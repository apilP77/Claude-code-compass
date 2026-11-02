"use client";

import { useEffect, useRef, useState } from "react";
import Compass from "@/components/Compass";
import Contour from "@/components/Contour";
import { useCompassInput } from "@/components/useCompassInput";
import { bearingFor, headingLabel } from "@/lib/bearing";
import { QUERY_MAX_LENGTH, QUERY_MIN_LENGTH } from "@/lib/skill-set";

/** Where the needle starts before it swings to north on first load. */
const START_BEARING = 150;

type HeroFinderProps = {
  query: string;
  resultCount: number;
};

/**
 * The top of the home page: the title, the Skill Set Finder entry, and the
 * compass. Searching and sorting the list live next to the list, in SearchBar
 * and SortSelect; the needle reads the current search from the URL.
 */
export default function HeroFinder({ query, resultCount }: HeroFinderProps) {
  const [armed, setArmed] = useState(false);
  const [spins, setSpins] = useState(0);
  const compassRef = useRef<SVGSVGElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const inputBearing = useCompassInput(compassRef);

  // Let the first paint show the needle off-north, then swing it to its bearing.
  useEffect(() => {
    const timer = setTimeout(() => setArmed(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // Contour lines drift a little with the pointer (depth set in globals.css).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    let frame = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        sectionRef.current?.style.setProperty(
          "--px",
          String((event.clientX / window.innerWidth - 0.5) * -2),
        );
        sectionRef.current?.style.setProperty(
          "--py",
          String((event.clientY / window.innerHeight - 0.5) * -2),
        );
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const lost = resultCount === 0 && query.trim() !== "";
  const following = query.trim() === "" && inputBearing !== null;
  const base = !armed
    ? START_BEARING
    : following
      ? inputBearing
      : bearingFor(query);
  // Each click adds two full turns, so the needle spins and settles back with a bounce.
  const bearing = base + spins * 720;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-line bg-[radial-gradient(ellipse_at_78%_48%,var(--c-glow),transparent_58%)]"
    >
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
            action="/skill-set"
            method="get"
            className="mt-8 max-w-2xl rounded-[10px] border border-accent/60 bg-surface p-4 shadow-sm sm:p-5"
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

        <div className="order-first flex flex-col items-center gap-1 justify-self-start md:order-none md:justify-self-center">
          <Compass
            ref={compassRef}
            bearing={bearing}
            tracking={following}
            lost={lost}
            onClick={() => setSpins((count) => count + 1)}
            className="h-20 w-20 cursor-pointer md:h-40 md:w-40"
          />
          <p aria-hidden="true" className="text-xs tabular-nums text-faint">
            {headingLabel(bearing)}
          </p>
        </div>
      </div>
    </section>
  );
}
