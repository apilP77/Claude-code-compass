import type { Repository } from "@/lib/schema";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";

/**
 * One badge per listing, in order of how much we can vouch for it:
 * verified by an editor, AI-written but unverified, or nothing checked yet.
 */
export default function ListingBadge({
  repository,
}: {
  repository: Pick<Repository, "listing_status" | "summary">;
}) {
  if (repository.listing_status === "reviewed") {
    return (
      <span className={`${base} border-verified/25 bg-verified/10 text-verified`}>
        Verified
      </span>
    );
  }

  if (repository.summary) {
    return (
      <span
        title="Written by AI from the README. Not yet verified by an editor."
        className={`${base} border-ai/25 bg-ai/10 text-ai`}
      >
        AI summary · not editor-verified
      </span>
    );
  }

  return (
    <span className={`${base} border-warn/25 bg-warn/10 text-warn`}>
      Unreviewed
    </span>
  );
}
