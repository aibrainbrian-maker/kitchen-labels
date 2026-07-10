import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/db";

export default async function PrintHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ allergen?: string }>;
}) {
  const { allergen } = await searchParams;

  const [runs, allAllergens] = await Promise.all([
    db.query.printRuns.findMany({
      with: { items: true, labelSize: true },
      orderBy: (t, { desc }) => desc(t.executedAt),
      limit: 200,
    }),
    db.query.allergens.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  const allergenName = allAllergens.find((a) => a.slug === allergen)?.name;

  const filtered = allergenName
    ? runs.filter((run) =>
        run.items.some((item) =>
          (item.allergensSnapshot as string[]).includes(allergenName)
        )
      )
    : runs;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Print history</h1>

      <form className="mb-6 flex gap-3" action="/print/history" method="get">
        <select
          name="allergen"
          defaultValue={allergen ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        >
          <option value="">All runs</option>
          {allAllergens.map((a) => (
            <option key={a.id} value={a.slug}>
              Runs containing: {a.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Filter
        </button>
      </form>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {runs.length === 0 ? "No print runs yet." : "No runs match this filter."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {filtered.map((run) => {
            const totalLabels = run.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <li key={run.id}>
                <Link
                  href={`/print/history/${run.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {format(run.executedAt, "EEE d MMM yyyy, HH:mm")}
                      {run.status === "voided" && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Voided
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {run.items.map((i) => `${i.productNameSnapshot} ×${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm text-neutral-500">
                    <p>{totalLabels} labels</p>
                    <p className="text-xs">{run.labelSize.name}</p>
                    {run.printedBy && <p className="text-xs">by {run.printedBy}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
