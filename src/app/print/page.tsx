import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/db";
import BrandSheetPicker from "@/components/BrandSheetPicker";
import SubmitButton from "@/components/SubmitButton";
import ProductQuantityList from "@/components/ProductQuantityList";
import { executePrintRun, saveStandingOrder } from "./actions";

// Creating a run writes many rows; give the action headroom on large lists.
export const maxDuration = 60;

export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; again?: string; standing?: string; savedOrder?: string }>;
}) {
  const { error, again, standing, savedOrder } = await searchParams;

  const [allProducts, labelSizes, brandTemplates, standingOrders] = await Promise.all([
    db.query.products.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      with: { productIngredients: { columns: { id: true } } },
      orderBy: (t, { desc, asc }) => [desc(t.isFavorite), desc(t.printCount), asc(t.name)],
    }),
    db.query.labelSizes.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => asc(t.name),
    }),
    db.query.brandTemplates.findMany({
      orderBy: (t, { desc, asc }) => [desc(t.isDefault), asc(t.name)],
    }),
    db.query.standingOrders.findMany({
      with: { items: true, brandTemplate: true },
      orderBy: (t, { asc }) => asc(t.name),
    }),
  ]);

  // Pre-fill quantities from a standing order or a previous run ("print again")
  const prefill = new Map<number, number>();
  let prefillLabelSizeId: number | null = null;
  let prefillBrandId: number | null = null;
  let loadedName: string | null = null;

  // Label set-ups that use the pot template, and every product sold in a pot
  // (union across pot lists). When a pot list is loaded we hide non-pot
  // products (sandwiches, paninis, …) so the list only shows relevant items.
  const potSizeIds = new Set(
    labelSizes.filter((s) => s.template === "pot").map((s) => s.id)
  );
  const potProductIds = new Set<number>();
  for (const o of standingOrders) {
    if (o.labelSizeId != null && potSizeIds.has(o.labelSizeId)) {
      for (const it of o.items) potProductIds.add(it.productId);
    }
  }
  let restrictToProductIds: Set<number> | null = null;

  if (standing) {
    const order = standingOrders.find((o) => o.id === Number(standing));
    if (order) {
      for (const item of order.items) prefill.set(item.productId, item.quantity);
      prefillLabelSizeId = order.labelSizeId;
      prefillBrandId = order.brandTemplateId;
      loadedName = order.name;
      if (order.labelSizeId != null && potSizeIds.has(order.labelSizeId)) {
        restrictToProductIds = potProductIds;
      }
    }
  } else if (again) {
    const rerun = await db.query.printRuns.findFirst({
      where: (t, { eq }) => eq(t.id, Number(again)),
      with: { items: true },
    });
    for (const item of rerun?.items ?? []) prefill.set(item.productId, item.quantity);
    prefillLabelSizeId = rerun?.labelSizeId ?? null;
    prefillBrandId = rerun?.brandTemplateId ?? null;
  }

  const today = format(new Date(), "yyyy-MM-dd");

  // Products shown in the quantity list — narrowed to pot products for pot lists.
  const visibleProducts = restrictToProductIds
    ? allProducts.filter((p) => restrictToProductIds!.has(p.id))
    : allProducts;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Print labels</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Set quantities, pick your label sheet, and print the whole batch as one PDF.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {savedOrder && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          Standing order saved.
        </p>
      )}
      {loadedName && (
        <p className="mb-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Loaded standing order: <strong>{loadedName}</strong>
        </p>
      )}

      {allProducts.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No products yet —{" "}
          <Link href="/products/new" className="underline">
            add a product
          </Link>{" "}
          first.
        </p>
      ) : (
        /* key forces the form (and its prefilled inputs) to remount when a
           standing order or re-run is loaded via client-side navigation */
        <form key={`${standing ?? ""}-${again ?? ""}`} action={executePrintRun}>
          {/* Carries the loaded standing order's customer prices into the run */}
          {loadedName && standing && (
            <input type="hidden" name="standingOrderId" value={standing} />
          )}
          <div className="mb-6 grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
            <BrandSheetPicker
              brands={brandTemplates.map((b) => ({
                id: b.id,
                name: b.name,
                isDefault: b.isDefault,
                labelSizeId: b.labelSizeId,
              }))}
              sizes={labelSizes.map((s) => ({ id: s.id, name: s.name }))}
              initialBrandId={prefillBrandId}
              initialSizeId={prefillLabelSizeId}
              standingOrderName={loadedName}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Prep date
              </label>
              <input
                type="date"
                name="prepDate"
                required
                defaultValue={today}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Start at label #
              </label>
              <input
                type="number"
                name="startAtPosition"
                min="1"
                defaultValue={1}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-neutral-400">
                For partly-used sheets, counting left to right, top to bottom.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Printed by (optional)
              </label>
              <input
                name="printedBy"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
                placeholder="Name"
              />
            </div>
          </div>

          <div className="mb-6">
            <SubmitButton
              pendingLabel="Generating PDF…"
              className="rounded-md bg-neutral-900 px-10 py-3.5 text-lg font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create print run →
            </SubmitButton>
          </div>

          {restrictToProductIds && (
            <p className="mb-2 text-xs text-neutral-500">
              Showing pot products only.
            </p>
          )}

          <ProductQuantityList
            products={visibleProducts.map((p) => ({
              id: p.id,
              name: p.name,
              isFavorite: p.isFavorite,
              hasRecipe: p.productIngredients.length > 0,
              qty: prefill.get(p.id) ?? 0,
            }))}
          />

          <div className="flex flex-wrap items-end gap-4">
            <SubmitButton
              pendingLabel="Generating PDF…"
              className="rounded-md bg-neutral-900 px-10 py-3.5 text-lg font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create print run →
            </SubmitButton>

            <div className="flex items-end gap-2 rounded-lg border border-dashed border-neutral-300 p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-500">
                  Save this list as a standing order
                </label>
                <input
                  name="standingOrderName"
                  placeholder="e.g. Riverside Café — Tuesdays"
                  defaultValue={loadedName ?? ""}
                  className="w-64 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                />
              </div>
              <SubmitButton
                formAction={saveStandingOrder}
                pendingLabel="Save order"
                className="rounded-md border border-neutral-400 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save order
              </SubmitButton>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
