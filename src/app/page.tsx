import Link from "next/link";
import { format } from "date-fns";
import { db } from "@/db";
import {
  deleteStandingOrder,
  copyStandingOrder,
  renameStandingOrder,
} from "./print/actions";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import RenameButton from "@/components/RenameButton";

export default async function DashboardPage() {
  const [favorites, mostPrinted, recentRuns, orders] = await Promise.all([
    db.query.products.findMany({
      where: (t, { eq, and }) => and(eq(t.isActive, true), eq(t.isFavorite, true)),
      orderBy: (t, { asc }) => asc(t.name),
      limit: 8,
    }),
    db.query.products.findMany({
      where: (t, { eq, and, gt }) => and(eq(t.isActive, true), gt(t.printCount, 0)),
      orderBy: (t, { desc }) => desc(t.printCount),
      limit: 5,
    }),
    db.query.printRuns.findMany({
      with: { items: true, labelSize: true },
      orderBy: (t, { desc }) => desc(t.executedAt),
      limit: 5,
    }),
    db.query.standingOrders.findMany({
      with: { items: true, brandTemplate: true },
      orderBy: (t, { asc }) => asc(t.name),
    }),
  ]);

  // "Blank" lists carry the product range at quantity zero — templates for
  // building a new list rather than ready-to-print runs.
  const withLabels = (o: (typeof orders)[number]) =>
    o.items.reduce((s, i) => s + i.quantity, 0);
  const printRunLists = orders.filter((o) => withLabels(o) > 0);
  const blankLists = orders.filter((o) => withLabels(o) === 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">Dashboard</h1>

      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/print"
          className="rounded-md bg-neutral-900 px-6 py-3.5 text-lg font-medium text-white hover:bg-neutral-700"
        >
          Create a New Print Run →
        </Link>
      </div>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Print runs</h2>
          {printRunLists.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Save a print list on the{" "}
              <Link href="/print" className="underline">
                print screen
              </Link>{" "}
              to pin it here.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {printRunLists.map((o) => (
                <li key={o.id} className="flex items-stretch">
                  <Link
                    href={`/print?standing=${o.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-900">{o.name}</span>
                    <span className="text-sm text-neutral-500">
                      {withLabels(o)} labels
                      {o.brandTemplate ? ` · ${o.brandTemplate.name}` : ""}
                    </span>
                  </Link>
                  <div className="flex items-center">
                    <form
                      action={async () => {
                        "use server";
                        await copyStandingOrder(o.id, "/");
                      }}
                      className="flex"
                    >
                      <button
                        type="submit"
                        title={`Copy "${o.name}"`}
                        className="px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        Copy
                      </button>
                    </form>
                    <RenameButton
                      currentName={o.name}
                      action={async (newName) => {
                        "use server";
                        await renameStandingOrder(o.id, newName);
                      }}
                    />
                    <ConfirmDeleteButton
                      label={o.name}
                      action={async () => {
                        "use server";
                        await deleteStandingOrder(o.id, "/");
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Blank print runs
          </h2>
          {blankLists.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No blank lists yet — a standing order saved with all quantities
              at zero appears here as a template.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {blankLists.map((o) => (
                <li key={o.id} className="flex items-stretch">
                  <Link
                    href={`/print?standing=${o.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 hover:bg-neutral-50"
                  >
                    <span className="font-medium text-neutral-900">{o.name}</span>
                    <span className="text-sm text-neutral-500">
                      {o.items.length} products
                      {o.brandTemplate ? ` · ${o.brandTemplate.name}` : ""}
                    </span>
                  </Link>
                  <div className="flex items-center">
                    <form
                      action={async () => {
                        "use server";
                        await copyStandingOrder(o.id, "/");
                      }}
                      className="flex"
                    >
                      <button
                        type="submit"
                        title={`Copy "${o.name}"`}
                        className="px-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                      >
                        Copy
                      </button>
                    </form>
                    <RenameButton
                      currentName={o.name}
                      action={async (newName) => {
                        "use server";
                        await renameStandingOrder(o.id, newName);
                      }}
                    />
                    <ConfirmDeleteButton
                      label={o.name}
                      action={async () => {
                        "use server";
                        await deleteStandingOrder(o.id, "/");
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Favourites</h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Star products in the{" "}
              <Link href="/products" className="underline">
                product library
              </Link>{" "}
              to pin them here.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {favorites.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.id}`}
                    className="block px-4 py-3 font-medium text-neutral-900 hover:bg-neutral-50"
                  >
                    ★ {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {mostPrinted.length > 0 && (
            <>
              <h2 className="mb-3 mt-8 text-lg font-semibold text-neutral-900">
                Most printed
              </h2>
              <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
                {mostPrinted.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/products/${p.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                    >
                      <span className="font-medium text-neutral-900">{p.name}</span>
                      <span className="text-sm text-neutral-500">
                        {p.printCount} labels
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Recent print runs</h2>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-neutral-500">No print runs yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {recentRuns.map((run) => (
                <li key={run.id}>
                  <Link
                    href={`/print/history/${run.id}`}
                    className="block px-4 py-3 hover:bg-neutral-50"
                  >
                    <p className="font-medium text-neutral-900">
                      {format(run.executedAt, "EEE d MMM, HH:mm")} ·{" "}
                      {run.items.reduce((s, i) => s + i.quantity, 0)} labels
                    </p>
                    <p className="mt-0.5 truncate text-sm text-neutral-500">
                      {run.items
                        .map((i) => `${i.productNameSnapshot} ×${i.quantity}`)
                        .join(", ")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
