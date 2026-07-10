import { db } from "./index";
import { allergens, labelSizes, labelCategories } from "./schema";

const THE_14_ALLERGENS = [
  ["Celery", "celery"],
  ["Cereals containing gluten", "cereals-containing-gluten"],
  ["Crustaceans", "crustaceans"],
  ["Eggs", "eggs"],
  ["Fish", "fish"],
  ["Lupin", "lupin"],
  ["Milk", "milk"],
  ["Molluscs", "molluscs"],
  ["Mustard", "mustard"],
  ["Peanuts", "peanuts"],
  ["Sesame", "sesame"],
  ["Soybeans", "soybeans"],
  ["Sulphur dioxide/sulphites", "sulphites"],
  ["Tree nuts", "tree-nuts"],
] as const;

// Border-colour categories for the wrap label template.
const LABEL_CATEGORIES = [
  { name: "Red meat", colorHex: "#e9536e", sortOrder: 1 },
  { name: "Chicken", colorHex: "#f0a840", sortOrder: 2 },
  { name: "Vegetarian", colorHex: "#79a877", sortOrder: 3 },
  { name: "Seafood", colorHex: "#3f7ad9", sortOrder: 4 },
];

// Common UK Avery A4 sheet label templates.
const LABEL_SIZE_PRESETS = [
  {
    name: "Sandwich wrap (6 per sheet)",
    kind: "sheet_grid" as const,
    template: "wrap" as const,
    widthMm: 63.4,
    heightMm: 139.5,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    cols: 3,
    rows: 2,
    marginTopMm: 7,
    marginLeftMm: 7.9,
    gapXMm: 3,
    gapYMm: 4,
  },
  {
    name: "Avery L7160 (21 per sheet)",
    kind: "sheet_grid" as const,
    widthMm: 63.5,
    heightMm: 38.1,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    cols: 3,
    rows: 7,
    marginTopMm: 15.15,
    marginLeftMm: 7.2,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  {
    name: "Avery L7163 (14 per sheet)",
    kind: "sheet_grid" as const,
    widthMm: 99.1,
    heightMm: 38.1,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    cols: 2,
    rows: 7,
    marginTopMm: 15.15,
    marginLeftMm: 4.65,
    gapXMm: 2.5,
    gapYMm: 0,
  },
  {
    name: "Avery L7651 (65 per sheet)",
    kind: "sheet_grid" as const,
    widthMm: 38.1,
    heightMm: 21.2,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    cols: 5,
    rows: 13,
    marginTopMm: 13.1,
    marginLeftMm: 4.99,
    gapXMm: 2.5,
    gapYMm: 0,
  },
];

async function main() {
  console.log("Seeding allergens...");
  for (const [name, slug] of THE_14_ALLERGENS) {
    await db.insert(allergens).values({ name, slug }).onConflictDoNothing();
  }

  console.log("Seeding label size presets...");
  for (const preset of LABEL_SIZE_PRESETS) {
    const existing = await db.query.labelSizes.findFirst({
      where: (t, { eq }) => eq(t.name, preset.name),
    });
    if (!existing) {
      await db.insert(labelSizes).values(preset);
    }
  }

  console.log("Seeding label categories...");
  for (const cat of LABEL_CATEGORIES) {
    await db.insert(labelCategories).values(cat).onConflictDoNothing();
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
