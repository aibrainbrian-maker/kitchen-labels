import { addDays, format } from "date-fns";
import type { LabelContent } from "./label-content";
import { tintPngDataUrl } from "./tint-logo";

const SAMPLE_CATEGORY_COLOR = "#e9536e";

/**
 * Fabricated but realistic label content used to show what a template's
 * printed label will look like (template designer previews). Includes a bold
 * allergen, a compound declaration, nutrition and a price so every part of
 * the layout is exercised.
 */
export function buildSampleLabelContent(brand: {
  businessName: string | null;
  businessAddress: string | null;
  logoDataUrl: string | null;
  tintLogo?: boolean;
  showStars?: boolean;
  innerBorder?: boolean;
  borderColorHex?: string | null;
}): LabelContent {
  const today = new Date();
  const expiry = addDays(today, 2);
  const border = brand.borderColorHex ?? SAMPLE_CATEGORY_COLOR;
  const logo =
    brand.tintLogo && brand.logoDataUrl
      ? tintPngDataUrl(brand.logoDataUrl, border)
      : brand.logoDataUrl;

  return {
    productName: "Ham & Cheese Sandwich",
    ingredients: [
      {
        name: "White Bread (WHEAT Flour [with added Calcium Carbonate, Iron, Niacin, Thiamin], Water, Salt, Yeast)",
        isAllergen: true,
      },
      { name: "Wiltshire Ham (Pork (90%), Water, Salt)", isAllergen: false },
      { name: "Cheddar Cheese (MILK)", isAllergen: true },
      {
        name: "Mayonnaise (rapeseed oil, water, EGG yolk, MUSTARD)",
        isAllergen: true,
      },
      { name: "Butter (MILK)", isAllergen: true },
    ],
    allergenNames: ["Cereals containing gluten", "Eggs", "Milk", "Mustard"],
    dateLabel: "Use by",
    dateValue: format(expiry, "EEE d MMM yyyy"),
    expiryDateIso: format(expiry, "yyyy-MM-dd"),
    prepDateIso: format(today, "yyyy-MM-dd"),
    storageInstructions: "Keep Refrigerated 5°C",
    nutritionPer100g: {
      energyKcal: 310,
      energyKj: 1292,
      fatG: 18.8,
      saturatesG: 7.4,
      carbohydrateG: 21.8,
      sugarsG: 2.7,
      fibreG: 1.2,
      proteinG: 13,
      saltG: 1.5,
    },
    totalWeightGrams: 185,
    description: "Wiltshire Ham and Mature Cheddar on White Bread",
    priceFormatted: "£3.80",
    categoryColorHex: border,
    businessName: brand.businessName,
    businessAddress: brand.businessAddress,
    logoDataUrl: logo,
    showStars: brand.showStars ?? false,
    innerBorder: brand.innerBorder ?? false,
  };
}
