import Link from "next/link";
import ListingBadge from "@/components/ListingBadge";
import type { Repository } from "@/lib/schema";

interface RepoCardProps {
  repository: Repository;
}

const CATEGORY_GLYPHS: Record<Repository["category"], string> = {
  skills: "◆",
  plugins: "⬡",
  collections: "▤",
  directories: "☰",
};

export default function RepoCard({ repository }: RepoCardProps) {
  const href = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-mono text-xs text-faint">
          {repository.id}
        </p>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs capitalize text-faint">
          <span aria-hidden="true">{CATEGORY_GLYPHS[repository.category]}</span>
          {repository.category}
        </span>
      </div>

      <h2 className="mt-2 text-lg font-semibold leading-[26px] tracking-tight text-fg transition-colors group-hover:text-accent">
        {repository.name}
      </h2>

      <p className="mt-2 line-clamp-3 flex-1 text-[15px] leading-6 text-muted">
        {repository.summary ?? repository.description}
      </p>

      <div className="mt-4">
        <ListingBadge repository={repository} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-faint">
        <span className="font-mono">
          {repository.license_spdx ?? "No license detected"}
        </span>
        {repository.stars !== null && (
          <span className="inline-flex items-center gap-1 font-mono text-star">
            <span aria-hidden="true">★</span>
            {repository.stars.toLocaleString()}
            <span className="sr-only"> stars</span>
          </span>
        )}
      </div>
    </Link>
  );
}
