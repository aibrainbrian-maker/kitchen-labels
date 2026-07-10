"use client";

/**
 * Small × delete button that asks for confirmation before submitting its
 * server action — standing orders delete immediately and permanently, so a
 * mis-click shouldn't cost a saved print list.
 */
export default function ConfirmDeleteButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${label}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
      className="flex"
    >
      <button
        type="submit"
        title={`Delete "${label}"`}
        className="px-3 text-neutral-400 hover:bg-red-50 hover:text-red-600"
      >
        ×
      </button>
    </form>
  );
}
