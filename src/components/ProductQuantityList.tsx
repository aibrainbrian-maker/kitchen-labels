"use client";

import { useMemo, useState } from "react";

export type ProductRow = {
  id: number;
  name: string;
  isFavorite: boolean;
  hasRecipe: boolean;
  qty: number;
};

/**
 * The print list's product rows with a live search box. Filtering only hides
 * non-matching rows (it never unmounts them), so quantities you've already
 * typed are never lost when you search for the next item.
 */
export default function ProductQuantityList({
  products,
}: {
  products: ProductRow[];
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const matchCount = useMemo(
    () => (q ? products.filter((p) => p.name.toLowerCase().includes(q)).length : products.length),
    [q, products]
  );

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
        {q && (
          <span className="text-xs text-neutral-500">
            {matchCount} match{matchCount === 1 ? "" : "es"}
          </span>
        )}
      </div>

      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
        {products.map((p) => {
          const hidden = q.length > 0 && !p.name.toLowerCase().includes(q);
          return (
            <li
              key={p.id}
              hidden={hidden}
              className="flex items-center justify-between gap-4 px-4 py-2.5"
            >
              <p className="min-w-0 truncate font-medium text-neutral-900">
                {p.isFavorite && <span title="Favourite">★ </span>}
                {p.name}
                {!p.hasRecipe && (
                  <span className="ml-2 text-xs font-normal text-amber-700">
                    ⚠ no recipe yet
                  </span>
                )}
              </p>
              <div className="shrink-0">
                <label className="sr-only" htmlFor={`qty_${p.id}`}>
                  Quantity for {p.name}
                </label>
                <input
                  id={`qty_${p.id}`}
                  type="number"
                  name={`qty_${p.id}`}
                  min="0"
                  max="9999"
                  defaultValue={p.qty || ""}
                  placeholder="0"
                  disabled={!p.hasRecipe}
                  className="w-24 rounded-md border border-neutral-300 px-3 py-2 text-center text-lg focus:border-neutral-500 focus:outline-none disabled:bg-neutral-100"
                />
              </div>
            </li>
          );
        })}
        {q && matchCount === 0 && (
          <li className="px-4 py-3 text-sm text-neutral-500">
            No products match &ldquo;{search}&rdquo;.
          </li>
        )}
      </ul>
    </div>
  );
}
