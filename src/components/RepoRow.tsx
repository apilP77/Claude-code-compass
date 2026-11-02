import Link from "next/link";
import { ViewTransition } from "react";
import CategorySymbol from "@/components/CategorySymbol";
import ListingBadge from "@/components/ListingBadge";
import type { Repository } from "@/lib/schema";

export function repoHref(repository: Pick<Repository, "owner" | "name">): string {
  return `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
}

/** One line in the index: symbol, name, summary, then status and facts. */
export default function RepoRow({ repository }: { repository: Repository }) {
  return (
    <ViewTransition name={`row-${repository.id}`} update="morph" default="none">
      <Link
        href={repoHref(repository)}
        className="group grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 transition-colors hover:bg-surface-2 sm:grid-cols-[1.25rem_minmax(0,1fr)_11rem] sm:px-5"
      >
        <span className="mt-1 text-faint transition-colors group-hover:text-accent">
          <CategorySymbol category={repository.category} />
          <span className="sr-only">{repository.category}</span>
        </span>

        <div className="min-w-0">
          <ViewTransition name={`repo-${repository.id}`} share="morph" default="none">
            <h3 className="display inline-block text-lg transition-colors group-hover:text-accent">
              {repository.name}
            </h3>
          </ViewTransition>
          <p className="mt-0.5 truncate text-sm text-faint">{repository.owner}</p>
          <p className="mt-1.5 line-clamp-2 max-w-[70ch] text-[15px] leading-6 text-muted">
            {repository.summary ?? repository.description}
          </p>
        </div>

        <div className="col-start-2 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-start-3 sm:flex-col sm:items-end sm:gap-1.5">
          <ListingBadge repository={repository} />
          <p className="flex items-center gap-3 text-sm text-faint">
            {repository.stars !== null && (
              <span className="font-medium text-star">
                <span aria-hidden="true">★ </span>
                {repository.stars.toLocaleString()}
                <span className="sr-only"> stars</span>
              </span>
            )}
            <span>{repository.license_spdx ?? "No license"}</span>
          </p>
        </div>
      </Link>
    </ViewTransition>
  );
}
