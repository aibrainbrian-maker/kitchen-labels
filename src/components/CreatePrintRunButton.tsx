"use client";

import { useTransition, type ReactNode } from "react";
import type { PrintRunResult } from "@/app/print/actions";

/**
 * Creates a print run and opens its PDF in a NEW tab, leaving the app open in
 * the current one. The tab is opened synchronously inside the click (so the
 * browser doesn't treat it as an unrequested popup and block it), then pointed
 * at the PDF once the run is saved. Shows a "Generating PDF…" state meanwhile
 * and disables to prevent double-clicks.
 */
export default function CreatePrintRunButton({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<PrintRunResult>;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        const form = e.currentTarget.closest("form");
        if (!form) return;
        const formData = new FormData(form);
        // Must open the tab here, in the click, or the browser blocks it.
        const tab = window.open("", "_blank");
        startTransition(async () => {
          const res = await action(formData);
          if (res?.error) {
            tab?.close();
            window.alert(res.error);
            return;
          }
          if (res?.runId) {
            const url = `/api/print/${res.runId}/pdf`;
            if (tab && !tab.closed) tab.location.href = url;
            else window.location.href = url; // popup blocked → same-tab fallback
          } else {
            tab?.close();
          }
        });
      }}
    >
      {pending ? "Generating PDF…" : children}
    </button>
  );
}
