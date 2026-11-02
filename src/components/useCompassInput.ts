import { useEffect, useRef, useState, type RefObject } from "react";
import { bearingToPoint, nearestBearing } from "@/lib/bearing";

/** Degrees of needle turn per pixel scrolled, for touch screens with no pointer. */
const SCROLL_DEGREES_PER_PIXEL = 0.35;

/**
 * Where the needle should point because of the visitor's input, or null when
 * there is none yet (or they asked for reduced motion). With a mouse it points
 * at the pointer; on a touch screen it turns as the page scrolls. The result
 * never jumps a full circle when crossing north.
 */
export function useCompassInput(
  compassRef: RefObject<SVGSVGElement | null>,
): number | null {
  const [bearing, setBearing] = useState<number | null>(null);
  const last = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const touchOnly = window.matchMedia("(hover: none)").matches;
    let frame = 0;

    function update(raw: number) {
      const next = nearestBearing(last.current, raw);
      last.current = next;
      setBearing(next);
    }

    function onPointerMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = compassRef.current?.getBoundingClientRect();
        if (!box || box.width === 0) {
          return;
        }
        update(
          bearingToPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
            event.clientX,
            event.clientY,
          ),
        );
      });
    }

    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        update(window.scrollY * SCROLL_DEGREES_PER_PIXEL);
      });
    }

    const type = touchOnly ? "scroll" : "pointermove";
    const handler = touchOnly ? onScroll : onPointerMove;
    window.addEventListener(type, handler as EventListener, { passive: true });
    return () => {
      window.removeEventListener(type, handler as EventListener);
      cancelAnimationFrame(frame);
    };
  }, [compassRef]);

  return bearing;
}
