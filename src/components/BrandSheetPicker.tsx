"use client";

import Link from "next/link";
import { useState } from "react";

type Brand = { id: number; name: string; isDefault: boolean; labelSizeId: number | null };
type Size = { id: number; name: string };

/**
 * Paired "Branding / customer" + "Label sheet" selects. Choosing a customer
 * jumps the sheet to that template's label set-up (still overridable).
 */
export default function BrandSheetPicker({
  brands,
  sizes,
  initialBrandId,
  initialSizeId,
  standingOrderName,
}: {
  brands: Brand[];
  sizes: Size[];
  initialBrandId: number | null;
  initialSizeId: number | null;
  /** Set when a saved print list is loaded — changing branding then warns. */
  standingOrderName?: string | null;
}) {
  const defaultBrand =
    (initialBrandId != null && brands.find((b) => b.id === initialBrandId)) ||
    brands.find((b) => b.isDefault) ||
    brands[0];

  const [brandId, setBrandId] = useState<number>(defaultBrand?.id);
  const [sizeId, setSizeId] = useState<number>(
    initialSizeId ?? defaultBrand?.labelSizeId ?? sizes[0]?.id
  );

  const applyBrand = (newId: number) => {
    setBrandId(newId);
    const brand = brands.find((b) => b.id === newId);
    if (brand?.labelSizeId) setSizeId(brand.labelSizeId);
  };

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Branding / customer
        </label>
        <select
          name="brandTemplateId"
          value={brandId}
          onChange={(e) => {
            const newId = Number(e.target.value);
            // Loaded print lists are tied to a customer — warn before changing
            // the branding on the saved list; suggest making a copy instead.
            if (standingOrderName) {
              const ok = window.confirm(
                `"${standingOrderName}" is a saved print list for a specific customer.\n\n` +
                  `Changing the branding / customer here will change it for this list.\n\n` +
                  `To keep the original unchanged, click Cancel and instead save a copy ` +
                  `under a new name (using the "Save as standing order" box below) before ` +
                  `switching branding.\n\nChange the branding anyway?`
              );
              if (!ok) return; // controlled value stays put, select reverts
            }
            applyBrand(newId);
          }}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.isDefault ? " (default)" : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-400">
          Sets the logo, business details and label set-up —{" "}
          <Link href="/labels/template" className="underline">
            manage templates
          </Link>
          .
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Label sheet
        </label>
        <select
          name="labelSizeId"
          required
          value={sizeId}
          onChange={(e) => setSizeId(Number(e.target.value))}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        >
          {sizes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
