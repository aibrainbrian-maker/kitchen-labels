"use client";

import { useTransition } from "react";

/**
 * Rename control for a saved print list: prompts for a new name, then calls
 * the bound server action. Kept a plain button (not a form) so the prompt can
 * supply the new value before anything is submitted.
 */
export default function RenameButton({
  action,
  currentName,
}: {
  action: (newName: string) => Promise<void>;
  currentName: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      title={`Rename "${currentName}"`}
      onClick={() => {
        const name = window.prompt(`Rename "${currentName}" to:`, currentName);
        if (name && name.trim() && name.trim() !== currentName) {
          startTransition(() => action(name.trim()));
        }
      }}
      className="px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-50"
    >
      Rename
    </button>
  );
}
