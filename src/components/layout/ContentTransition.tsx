"use client";

import { usePathname } from "next/navigation";

/**
 * Re-keys on route change so the page content gently fades/slides in on each
 * navigation (and on first load). Purely presentational — data lives in
 * context above, so remounting the page reads cached state, not a refetch.
 */
export default function ContentTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-content-in">
      {children}
    </div>
  );
}
