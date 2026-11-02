"use client";

import { useRef } from "react";
import Compass from "@/components/Compass";
import { useCompassInput } from "@/components/useCompassInput";

/** The small compass in the header: it follows the pointer, or the scroll on touch screens. */
export default function LogoCompass() {
  const ref = useRef<SVGSVGElement>(null);
  const bearing = useCompassInput(ref);

  return (
    <Compass
      ref={ref}
      bearing={bearing ?? 0}
      tracking={bearing !== null}
      lost={false}
      className="h-7 w-7 shrink-0"
    />
  );
}
