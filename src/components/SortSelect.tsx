"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { REPOSITORY_SORTS, type RepositorySort } from "@/lib/search";

const SORT_LABELS: Record<RepositorySort, string> = {
  verified: "Editor's picks first",
  stars: "Most stars",
  newest: "Recently added",
  name: "Name (A–Z)",
  last_checked: "Recently checked",
};

/** Sort for the repository list. Writes `sort` to the URL and keeps q/category. */
export default function SortSelect({ sort }: { sort: RepositorySort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="repository-sort" className="text-sm text-faint">
        Sort
      </label>
      <select
        id="repository-sort"
        value={sort}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          if (event.target.value === "verified") {
            next.delete("sort");
          } else {
            next.set("sort", event.target.value);
          }
          const search = next.toString();
          router.replace(search ? `/?${search}` : "/", { scroll: false });
        }}
        className="h-10 rounded-md border border-line-strong bg-surface px-3 text-sm text-fg outline-none transition-colors hover:border-ink focus:border-accent"
      >
        {REPOSITORY_SORTS.map((value) => (
          <option key={value} value={value}>
            {SORT_LABELS[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
