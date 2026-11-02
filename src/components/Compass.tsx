import type { Ref } from "react";

type CompassProps = {
  /** Degrees clockwise from north. The needle springs to this bearing. */
  bearing: number;
  /** True when a search found nothing: the needle wobbles instead of settling. */
  lost: boolean;
  /** True while the needle follows the pointer: it turns faster than a settle. */
  tracking?: boolean;
  ref?: Ref<SVGSVGElement>;
  /** Decorative flourish only (the compass is hidden from assistive tech). */
  onClick?: () => void;
  className?: string;
};

/**
 * The product mark and a small instrument: the needle turns toward a bearing
 * derived from what you type, and wobbles when nothing matches. Purely
 * decorative (the results text carries the information), so it is hidden from
 * assistive tech.
 */
export default function Compass({
  bearing,
  lost,
  tracking = false,
  ref,
  onClick,
  className = "h-36 w-36",
}: CompassProps) {
  const ticks = Array.from({ length: 24 }, (_, index) => index * 15);

  return (
    <svg
      ref={ref}
      onClick={onClick}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <circle cx="60" cy="60" r="55" className="fill-surface stroke-ink" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="46" className="stroke-line-strong" strokeWidth="1" />
      {ticks.map((angle) => (
        <line
          key={angle}
          x1="60"
          y1={angle % 90 === 0 ? 8 : 11}
          x2="60"
          y2="16"
          className="stroke-ink"
          strokeWidth={angle % 90 === 0 ? 1.6 : 1}
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
      <text
        x="60"
        y="30"
        textAnchor="middle"
        className="fill-ink"
        fontSize="10"
        fontWeight="700"
        fontFamily="var(--font-display)"
      >
        N
      </text>

      <g
        className="needle"
        data-lost={lost ? "true" : "false"}
        data-tracking={tracking ? "true" : "false"}
        style={{ ["--bearing" as string]: `${bearing}deg` }}
      >
        <polygon points="60,22 66,60 54,60" className="fill-blaze" />
        <polygon points="60,98 66,60 54,60" className="fill-ink" />
      </g>
      <circle cx="60" cy="60" r="4" className="fill-surface stroke-ink" strokeWidth="1.5" />
    </svg>
  );
}
