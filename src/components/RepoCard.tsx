import Link from "next/link";
import type { Repository } from "@/lib/schema";

interface RepoCardProps {
  repository: Repository;
}

export default function RepoCard({ repository }: RepoCardProps) {
  const href = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}`;
  const categoryStyles: Record<Repository["category"], string> = {
    skills:
      "bg-violet-400/10 text-violet-200 ring-violet-300/20 shadow-[0_0_16px_rgba(167,139,250,0.12)]",
    plugins:
      "bg-cyan-400/10 text-cyan-200 ring-cyan-300/20 shadow-[0_0_16px_rgba(103,232,249,0.12)]",
    collections:
      "bg-amber-400/10 text-amber-200 ring-amber-300/20 shadow-[0_0_16px_rgba(252,211,77,0.12)]",
    directories:
      "bg-emerald-400/10 text-emerald-200 ring-emerald-300/20 shadow-[0_0_16px_rgba(110,231,183,0.12)]",
  };

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl hover:shadow-black/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-slate-500">
            {repository.id}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-cyan-200">
            {repository.name}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${categoryStyles[repository.category]}`}
        >
          {repository.category}
        </span>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">
        {repository.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-medium text-slate-300">
          {repository.license_spdx ?? "No license detected"}
        </span>
        {repository.stars !== null && (
          <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-medium text-amber-200">
            ★ {repository.stars.toLocaleString()} stars
          </span>
        )}
        {repository.listing_status === "reviewed" ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            ✓ Verified
          </span>
        ) : (
          <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-300">
            ⚠ Unreviewed
          </span>
        )}
      </div>
    </Link>
  );
}
