"use client";

import { useTransition, type ReactNode } from "react";

/**
 * Saves the current print list as a standing order. A plain button (not a form
 * submit) so it coexists with the new-tab Create button in the same form.
 */
export default function SaveOrderButton({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={(e) => {
        const form = e.currentTarget.closest("form");
        if (!form) return;
        const formData = new FormData(form);
        startTransition(() => action(formData));
      }}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
