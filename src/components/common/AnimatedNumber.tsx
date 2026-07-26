"use client";

import { useEffect, useRef, useState } from "react";

const DURATION = 550;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Counts a numeric value up (from 0 on mount, or from the previous value on
 * change) and formats each frame with `format`. Skips the animation — showing
 * the target immediately — when reduced motion is requested or when the
 * formatted text wouldn't change anyway (e.g. the privacy mask, or an
 * unchanged value), so it composes cleanly with the money formatters.
 */
export default function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || format(from) === format(to)) {
      fromRef.current = to;
      setDisplay(to);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      // The first rAF timestamp can sit just before `start`; clamp both ends
      // so progress never goes negative (which would overshoot below `from`).
      const progress = Math.min(Math.max((now - start) / DURATION, 0), 1);
      const current = from + (to - from) * easeOutCubic(progress);
      fromRef.current = current;
      setDisplay(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, format]);

  return <span className={className}>{format(display)}</span>;
}
