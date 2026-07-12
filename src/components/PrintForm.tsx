"use client";

import type { ReactNode } from "react";

/**
 * Wrapper for the print list form. Its buttons run their actions via onClick
 * (so the PDF can open in a new tab), so this blocks the browser's native
 * "press Enter to submit" — which would otherwise fire an action unexpectedly.
 */
export default function PrintForm({ children }: { children: ReactNode }) {
  return <form onSubmit={(e) => e.preventDefault()}>{children}</form>;
}
