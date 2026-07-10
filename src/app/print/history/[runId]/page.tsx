import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/db";
import AllergenBadgeList from "@/components/AllergenBadgeList";
import type { LabelIngredientToken } from "@/lib/labels/label-content";

export default async function PrintRunDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { runId } = await params;
  const { new: isNew } = await searchParams;

  const run = await db.query.printRuns.findFirst({
    where: (t, { eq }) => eq(t.id, Number(runId)),
    with: { items: true, labelSize: true },
  });

  if (!run) notFound();

  const totalLabels = run.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/print/history" className="text-sm text-neutral-500 hover:underline">
        ← Print history
      </Link>
      <div className="mb-6 mt-1 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Print run #{run.id}
          </h1>
          <p className="text-sm text-neutral-500">
            {format(run.executedAt, "EEEE d MMMM yyyy, HH:mm")} · {run.labelSize.name} ·{" "}
            {totalLabels} labels
            {run.printedBy && ` · by ${run.printedBy}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/print/${run.id}/pdf`}
            target="_blank"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-base font-medium text-white hover:bg-neutral-700"
          >
            {isNew ? "Open PDF to print" : "Reprint PDF"}
          </a>
          <Link
            href={`/print?again=${run.id}`}
            className="rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Print again (new dates)
          </Link>
        </div>
      </div>

      {isNew && (
        <p className="mb-6 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Print run saved. Open the PDF and print it onto your label sheets —
          check &quot;Actual size&quot; (not &quot;Fit to page&quot;) in the print dialog so
          labels line up with the sheet.
        </p>
      )}

      <div className="space-y-4">
        {run.items.map((item) => {
          const ingredients = item.ingredientsSnapshot as LabelIngredientToken[];
          const allergenNames = item.allergensSnapshot as string[];
          return (
            <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">
                  {item.productNameSnapshot}{" "}
                  <span className="font-normal text-neutral-500">× {item.quantity}</span>
                </h2>
                <p className="text-sm text-neutral-500">
                  Prep {format(new Date(item.prepDate), "d MMM")} → expiry{" "}
                  {format(new Date(item.computedExpiryDate), "d MMM yyyy")}
                </p>
              </div>
              <p className="mb-2 text-sm leading-relaxed">
                <span className="font-semibold">Ingredients: </span>
                {ingredients.map((ing, i) => (
                  <span key={`${ing.name}-${i}`}>
                    {i > 0 && ", "}
                    {ing.isAllergen ? <strong>{ing.name}</strong> : ing.name}
                  </span>
                ))}
              </p>
              <AllergenBadgeList names={allergenNames} emptyText="No allergens" />
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        This record shows exactly what was printed at the time — later recipe
        edits do not change it.
      </p>
    </div>
  );
}
