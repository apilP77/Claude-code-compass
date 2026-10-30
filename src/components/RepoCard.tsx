import Link from "next/link";
import type { Repository } from "@/lib/schema";

interface RepoCardProps {
  repository: Repository;
}

export default function RepoCard({ repository }: RepoCardProps) {
  const href = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-teal-700 dark:focus-visible:outline-teal-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {repository.id}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950 group-hover:text-teal-800 dark:text-white dark:group-hover:text-teal-300">
            {repository.name}
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium capitalize text-teal-800 dark:bg-teal-950 dark:text-teal-200">
          {repository.category}
        </span>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
        {repository.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
          {repository.license_spdx ?? "No license detected"}
        </span>
        {repository.listing_status === "reviewed" && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            Verified
          </span>
        )}
      </div>
    </Link>
  );
}
