"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import CategorySymbol from "@/components/CategorySymbol";
import Compass from "@/components/Compass";
import CopyCommand from "@/components/CopyCommand";
import ListingBadge from "@/components/ListingBadge";
import { bearingFor } from "@/lib/bearing";
import {
  QUERY_MAX_LENGTH,
  QUERY_MIN_LENGTH,
  type SkillSetEntry,
  type SkillSetResult,
} from "@/lib/skill-set";

const EXAMPLES = [
  "A Next.js SaaS with Stripe and Supabase",
  "A Python data pipeline with good tests",
  "Reviewing pull requests and cleaning up commits",
  "Designing a landing page for a developer tool",
];

type Outcome = { result: SkillSetResult } | { error: string } | null;

async function requestSkillSet(query: string): Promise<Outcome> {
  try {
    const response = await fetch("/api/skill-set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const message =
        typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
          ? body.error
          : "Could not get recommendations. Please try again.";
      return { error: message };
    }
    return { result: body as SkillSetResult };
  } catch {
    return { error: "Could not reach the server. Check your connection and try again." };
  }
}

/** Groups picks by role, keeping the order the server sent them in. */
function groupByRole(picks: SkillSetEntry[]): Array<{ role: string; picks: SkillSetEntry[] }> {
  const groups: Array<{ role: string; picks: SkillSetEntry[] }> = [];
  for (const pick of picks) {
    const group = groups.find((candidate) => candidate.role === pick.role);
    if (group) {
      group.picks.push(pick);
    } else {
      groups.push({ role: pick.role, picks: [pick] });
    }
  }
  return groups;
}

export default function SkillSetFinder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [text, setText] = useState(initialQuery);
  const [loading, setLoading] = useState(initialQuery.trim().length >= QUERY_MIN_LENGTH);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // A shared link (?q=...) runs once when the page opens.
  useEffect(() => {
    const query = initialQuery.trim();
    if (query.length < QUERY_MIN_LENGTH) {
      return;
    }
    let active = true;
    void requestSkillSet(query).then((next) => {
      if (active) {
        setOutcome(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // Only on first load; later searches go through `submit`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < QUERY_MIN_LENGTH || loading) {
      return;
    }
    setLoading(true);
    setOutcome(null);
    router.replace(`/skill-set?q=${encodeURIComponent(trimmed)}`, { scroll: false });
    setOutcome(await requestSkillSet(trimmed));
    setLoading(false);
  }

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied(null), 2000);
  }

  const result = outcome && "result" in outcome ? outcome.result : null;
  const commands = result
    ? result.picks.flatMap((pick) => (pick.getting_started ? [pick.getting_started] : []))
    : [];
  const tooShort = text.trim().length < QUERY_MIN_LENGTH;
  // Searching: the needle wobbles. Done: it swings toward the first pick.
  const needleBearing = result?.picks[0] ? bearingFor(result.picks[0].id) : 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="display text-4xl sm:text-5xl">Find your skill set</h1>
          <p className="mt-4 max-w-[60ch] text-base text-muted">
            Describe what you are working on. You get a short list of skills,
            plugins and collections from this directory that fit together.
          </p>
        </div>
        <Compass
          bearing={needleBearing}
          lost={loading}
          className="hidden h-24 w-24 shrink-0 sm:block"
        />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit(text);
        }}
        className="mt-8"
      >
        <label htmlFor="project" className="text-sm font-medium">
          What are you building?
        </label>
        <textarea
          id="project"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={QUERY_MAX_LENGTH}
          rows={3}
          placeholder="For example: a Next.js SaaS with Stripe and Supabase, and I want good tests"
          className="mt-2 w-full resize-y rounded-md border border-line-strong bg-surface px-4 py-3 text-base text-fg outline-none transition-colors placeholder:text-faint hover:border-ink focus:border-accent"
        />
        <div className="mt-1 flex items-center justify-between text-[13px] text-faint">
          <span>
            {tooShort && text.length > 0
              ? `Add a few more words (at least ${QUERY_MIN_LENGTH} characters).`
              : " "}
          </span>
          <span aria-hidden="true">
            {text.length}/{QUERY_MAX_LENGTH}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={tooShort || loading}
            className="min-h-11 rounded-md bg-ink px-5 text-sm font-semibold text-bg transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Plotting your route" : "Find my skill set"}
          </button>
          <span className="text-sm text-faint">Or try one:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="rounded-md border border-line-strong px-3 py-1.5 text-left text-[13px] text-muted transition-colors hover:border-ink hover:text-fg"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite" className="mt-10">
        {loading && (
          <p className="text-muted">Plotting your route…</p>
        )}

        {outcome && "error" in outcome && (
          <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
            {outcome.error}
          </p>
        )}

        {result && result.picks.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
            <p className="display text-xl">Nothing in the directory fits that yet</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-muted">
              Try describing the kind of work, such as testing, code review or
              design, instead of the product. Or browse everything.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center rounded-md bg-ink px-5 text-sm font-semibold text-bg transition-colors hover:bg-accent"
            >
              Browse the directory
            </Link>
          </div>
        )}

        {result && result.picks.length > 0 && (
          <>
            <p
              className={`rounded-md border px-4 py-3 text-sm ${
                result.source === "ai"
                  ? "border-ai/40 bg-ai/10 text-ai"
                  : "border-warn/40 bg-warn/10 text-warn"
              }`}
            >
              {result.source === "ai"
                ? "AI suggestions. Check each repository before you install anything."
                : "AI suggestions are unavailable right now, so these are matched by keywords. Check each repository before you install anything."}
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-faint">
                {result.picks.length} {result.picks.length === 1 ? "pick" : "picks"} for your project
              </p>
              <div className="flex flex-wrap gap-2">
                {commands.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void copy("all", commands.join("\n"))}
                    className="min-h-10 rounded-md border border-line-strong px-4 text-sm font-medium transition-colors hover:border-ink hover:bg-surface"
                  >
                    {copied === "all"
                      ? "Copied"
                      : `Copy all install commands (${commands.length})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void copy("link", window.location.href)}
                  className="min-h-10 rounded-md border border-line-strong px-4 text-sm font-medium transition-colors hover:border-ink hover:bg-surface"
                >
                  {copied === "link" ? "Link copied" : "Copy link to this result"}
                </button>
              </div>
            </div>
            {copied === "failed" && (
              <p role="alert" className="mt-2 text-sm text-danger">
                Could not copy. Select the text and copy it by hand.
              </p>
            )}

            <ol className="relative mt-8 space-y-8 pl-12 sm:pl-14">
              <span
                aria-hidden="true"
                className="route-line absolute bottom-3 left-[17px] top-3 border-l-2 border-dashed border-line-strong sm:left-[19px]"
              />
              {groupByRole(result.picks).map((group, index) => (
              <li
                key={group.role}
                className="route-stop relative"
                style={{ ["--i" as string]: index }}
                aria-labelledby={`role-${group.role}`}
              >
                <span
                  aria-hidden="true"
                  className="display absolute -left-12 top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-accent bg-bg text-sm text-accent sm:-left-14 sm:h-10 sm:w-10"
                >
                  {index + 1}
                </span>
                <h2 id={`role-${group.role}`} className="display text-xl leading-9 sm:leading-10">
                  {group.role}
                </h2>
                <ul className="mt-3 space-y-4">
                  {group.picks.map((pick) => (
                    <li
                      key={pick.id}
                      className="rounded-[10px] border border-line-strong bg-surface p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/repos/${encodeURIComponent(pick.owner)}/${encodeURIComponent(pick.name)}`}
                            className="display inline-flex items-center gap-2 text-lg transition-colors hover:text-accent"
                          >
                            <CategorySymbol category={pick.category} className="h-4 w-4 text-faint" />
                            {pick.name}
                          </Link>
                          <p className="text-sm text-faint">{pick.owner}</p>
                        </div>
                        <ListingBadge
                          repository={{
                            listing_status: pick.listing_status,
                            summary: pick.has_ai_summary ? pick.summary : undefined,
                          }}
                        />
                      </div>

                      <p className="mt-3 text-[15px] leading-6">{pick.reason}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{pick.summary}</p>

                      {pick.getting_started && (
                        <div className="mt-4">
                          <CopyCommand command={pick.getting_started} />
                        </div>
                      )}

                      <p className="mt-3 flex items-center gap-3 text-sm text-faint">
                        {pick.stars !== null && (
                          <span className="font-medium text-star">
                            <span aria-hidden="true">★ </span>
                            {pick.stars.toLocaleString()}
                            <span className="sr-only"> stars</span>
                          </span>
                        )}
                        <span>{pick.license ?? "No license"}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
