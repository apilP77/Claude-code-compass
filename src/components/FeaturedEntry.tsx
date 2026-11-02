import Link from "next/link";
import CategorySymbol from "@/components/CategorySymbol";
import ListingBadge from "@/components/ListingBadge";
import { repoHref } from "@/components/RepoRow";
import type { Repository } from "@/lib/schema";

/**
 * A larger entry for the most-starred repositories. It has no view-transition
 * name: the same repository also appears in the index, and names must be unique.
 */
export default function FeaturedEntry({ repository }: { repository: Repository }) {
  return (
    <Link
      href={repoHref(repository)}
      className="group flex h-full flex-col rounded-[10px] border border-line-strong bg-surface p-6 transition-colors hover:border-ink"
    >
      <div className="flex items-center justify-between gap-3 text-faint">
        <span className="inline-flex items-center gap-2 text-sm capitalize">
          <CategorySymbol category={repository.category} />
          {repository.category}
        </span>
        {repository.stars !== null && (
          <span className="text-sm font-medium text-star">
            <span aria-hidden="true">★ </span>
            {repository.stars.toLocaleString()}
            <span className="sr-only"> stars</span>
          </span>
        )}
      </div>

      <h3 className="display mt-4 text-2xl transition-colors group-hover:text-accent">
        {repository.name}
      </h3>
      <p className="mt-0.5 text-sm text-faint">{repository.owner}</p>

      <p className="mt-3 line-clamp-4 flex-1 text-[15px] leading-6 text-muted">
        {repository.summary ?? repository.description}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ListingBadge repository={repository} />
        <span className="text-sm text-faint">
          {repository.license_spdx ?? "No license"}
        </span>
      </div>
    </Link>
  );
}
