import { addDays, addHours, addWeeks, format } from "date-fns";
import type { DerivedProduct } from "@/lib/nutrition";

export type LabelIngredientToken = { name: string; isAllergen: boolean };

/**
 * Everything needed to render one physical label. This same object drives the
 * on-screen preview, the printed PDF, and the print-run snapshot, so what you
 * see, what prints, and what is recorded are always identical.
 */
export type LabelContent = {
  productName: string;
  ingredients: LabelIngredientToken[];
  allergenNames: string[];
  dateLabel: string; // "Use by" | "Best before"
  dateValue: string; // formatted for display, e.g. "Mon 6 Jul 2026"
  expiryDateIso: string; // yyyy-MM-dd, for storage
  prepDateIso: string;
  storageInstructions: string | null;
  nutritionPer100g: DerivedProduct["nutritionPer100g"];
  totalWeightGrams: number;
  // Wrap-template extras (all optional; the simple template ignores them)
  description?: string | null;
  priceFormatted?: string | null; // e.g. "£3.80"
  categoryColorHex?: string | null; // label border colour
  businessName?: string | null;
  businessAddress?: string | null;
  /** Attached at render time from settings, never snapshotted (too large). */
  logoDataUrl?: string | null;
  /** Brand styling: five stars in the category colour above the logo. */
  showStars?: boolean;
  /** Brand styling: thin rule just inside the thick colour frame. */
  innerBorder?: boolean;
};

export function formatPrice(pricePence: number | null | undefined): string | null {
  if (pricePence == null) return null;
  return `£${(pricePence / 100).toFixed(2)}`;
}

export function computeExpiryDate(
  prepDate: Date,
  value: number,
  unit: "hours" | "days" | "weeks"
): Date {
  switch (unit) {
    case "hours":
      return addHours(prepDate, value);
    case "days":
      return addDays(prepDate, value);
    case "weeks":
      return addWeeks(prepDate, value);
  }
}

export function buildLabelContent(args: {
  productName: string;
  derived: DerivedProduct;
  allergenNamesBySlug: Map<string, string>;
  shelfLifeValue: number;
  shelfLifeUnit: "hours" | "days" | "weeks";
  shelfLifeType: "use_by" | "best_before";
  storageInstructions: string | null;
  prepDate: Date;
  description?: string | null;
  pricePence?: number | null;
  categoryColorHex?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  logoDataUrl?: string | null;
  showStars?: boolean;
  innerBorder?: boolean;
}): LabelContent {
  const expiry = computeExpiryDate(args.prepDate, args.shelfLifeValue, args.shelfLifeUnit);

  return {
    productName: args.productName,
    ingredients: args.derived.ingredients.map((i) => ({
      name: i.labelText,
      isAllergen: i.isAllergen,
    })),
    allergenNames: args.derived.allergenSlugs.map(
      (slug) => args.allergenNamesBySlug.get(slug) ?? slug
    ),
    dateLabel: args.shelfLifeType === "use_by" ? "Use By" : "Best Before",
    dateValue: format(expiry, "dd/MM/yyyy"),
    expiryDateIso: format(expiry, "yyyy-MM-dd"),
    prepDateIso: format(args.prepDate, "yyyy-MM-dd"),
    storageInstructions: args.storageInstructions,
    nutritionPer100g: args.derived.nutritionPer100g,
    totalWeightGrams: args.derived.totalWeightGrams,
    description: args.description ?? null,
    priceFormatted: formatPrice(args.pricePence),
    categoryColorHex: args.categoryColorHex ?? null,
    businessName: args.businessName ?? null,
    businessAddress: args.businessAddress ?? null,
    logoDataUrl: args.logoDataUrl ?? null,
    showStars: args.showStars ?? false,
    innerBorder: args.innerBorder ?? false,
  };
}
