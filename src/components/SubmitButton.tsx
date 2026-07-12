"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Action = (formData: FormData) => void | Promise<void>;

/**
 * Form submit button that disables while its form is submitting and (when
 * `pendingLabel` differs from the label) shows progress text — so a slow
 * action like generating a print PDF gives clear feedback and can't be fired
 * twice by an impatient double-click.
 *
 * All submit buttons in a form share one pending state, so give a secondary
 * button (e.g. "Save order") a pendingLabel equal to its normal text: it then
 * just disables during the primary action without mislabelling itself.
 */
export default function SubmitButton({
  children,
  pendingLabel,
  formAction,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  /** Set only if this button overrides the form's action. */
  formAction?: Action;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
