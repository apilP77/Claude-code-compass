import type { Repository } from "@/lib/schema";

const base =
  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[13px] font-medium leading-5";

/**
 * At most one badge per listing, in order of how much we can vouch for it.
 * Each one carries words, never color alone.
 */
export default function ListingBadge({
  repository,
}: {
  repository: Pick<Repository, "listing_status" | "summary">;
}) {
  if (repository.listing_status === "reviewed") {
    return (
      <span className={`${base} border-verified/40 bg-verified/10 text-verified`}>
        <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2.5 6.5 2.2 2.2 4.8-5.4" />
        </svg>
        Editor&rsquo;s pick
      </span>
    );
  }

  if (repository.summary) {
    return (
      <span
        title="The summary was written by AI from the project's README. Nobody has checked it yet."
        className={`${base} border-ai/40 bg-ai/10 text-ai`}
      >
        AI-written summary
      </span>
    );
  }

  // Not every listing is hand-checked, so an unreviewed one gets no badge.
  return null;
}
