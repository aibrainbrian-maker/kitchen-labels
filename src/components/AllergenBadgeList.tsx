export default function AllergenBadgeList({
  names,
  emptyText,
}: {
  names: string[];
  emptyText?: string;
}) {
  if (names.length === 0) {
    return emptyText ? (
      <span className="text-xs text-neutral-400">{emptyText}</span>
    ) : null;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {names.map((name) => (
        <span
          key={name}
          className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
        >
          {name}
        </span>
      ))}
    </div>
  );
}
