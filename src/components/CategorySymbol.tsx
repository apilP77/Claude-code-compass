import type { Repository } from "@/lib/schema";

type Category = Repository["category"];

/**
 * Map-legend symbols, one per category. Shapes are borrowed from survey maps
 * (triangulation point, spot height) so the legend and the list share one
 * vocabulary. The name is always shown next to the symbol, never the shape alone.
 */
export default function CategorySymbol({
  category,
  className = "h-4 w-4",
}: {
  category: Category;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 16 16",
    className,
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinejoin: "round" as const,
  };

  switch (category) {
    case "skills":
      return (
        <svg {...common}>
          <path d="M8 1.5 14.5 8 8 14.5 1.5 8Z" />
        </svg>
      );
    case "plugins":
      return (
        <svg {...common}>
          <path d="M8 1.5 13.6 4.75v6.5L8 14.5l-5.6-3.25v-6.5Z" />
        </svg>
      );
    case "collections":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="12" height="12" rx="1.5" />
          <path d="M2 6h12M2 10h12" />
        </svg>
      );
    case "directories":
      return (
        <svg {...common}>
          <path d="M8 2 14.5 13.5h-13Z" />
          <circle cx="8" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
