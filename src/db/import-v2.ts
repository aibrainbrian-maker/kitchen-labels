// Import of the Product Details folder catalogue (8 category reports).
// Idempotent: component ingredients are matched by name and products by slug.
// Unlike the v1 import, existing products are UPDATED — the v2 reports carry
// full per-100g panels, prices and menu categories that upgrade the partial
// data from the original sandwiches import. Recipes and pack weights of
// existing products are left untouched. Run with: npm run db:import-v2
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  ingredients,
  ingredientAllergens,
  products,
  productIngredients,
} from "./schema";
import { COMPONENTS } from "./import-eatpure-components";
import { CATALOGUE_V2 } from "./import-v2-products";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Panel = {
  energyKcal: number;
  energyKj: number;
  fatG: number;
  saturatesG: number;
  carbohydrateG: number;
  sugarsG: number;
  fibreG: number;
  proteinG: number;
  saltG: number;
};

async function main() {
  const allergenRows = await db.query.allergens.findMany();
  const allergenBySlug = new Map(allergenRows.map((a) => [a.slug, a.id]));
  const categoryRows = await db.query.labelCategories.findMany();
  const categoryByName = new Map(categoryRows.map((c) => [c.name, c.id]));

  // 1. Component ingredients (shared list with the v1 import, so re-running
  // this after new components were appended picks the new ones up).
  console.log(`Importing ${COMPONENTS.length} component ingredients...`);
  const ingredientIdByName = new Map<string, number>();
  let newIngredients = 0;

  for (const comp of COMPONENTS) {
    let row = await db.query.ingredients.findFirst({
      where: eq(ingredients.name, comp.name),
    });
    if (!row) {
      [row] = await db
        .insert(ingredients)
        .values({ name: comp.name, labelDeclaration: comp.declaration })
        .returning();
      newIngredients++;
      for (const slug of comp.allergens) {
        const allergenId = allergenBySlug.get(slug);
        if (!allergenId) throw new Error(`Unknown allergen slug: ${slug} (${comp.name})`);
        await db
          .insert(ingredientAllergens)
          .values({ ingredientId: row.id, allergenId })
          .onConflictDoNothing();
      }
    }
    ingredientIdByName.set(comp.name, row.id);
  }
  console.log(`  ${newIngredients} new, ${COMPONENTS.length - newIngredients} already existed.`);

  // 2. Products
  console.log(`Importing ${CATALOGUE_V2.length} products...`);
  let newProducts = 0;
  let updatedProducts = 0;

  for (const item of CATALOGUE_V2) {
    const slug = slugify(item.name);

    // Same rule as v1: a panel where carbs, protein and salt are all zero is
    // supplier "no data", not a real all-zero food — omit it.
    const isPartial =
      item.nutrition != null && item.nutrition.slice(4).every((v) => v === 0);
    const raw = item.nutrition && !isPartial ? item.nutrition : null;
    const panel: Panel | null = raw
      ? {
          energyKcal: raw[0],
          energyKj: raw[1],
          fatG: raw[2],
          saturatesG: raw[3],
          carbohydrateG: raw[4],
          sugarsG: raw[5],
          fibreG: raw[6],
          proteinG: raw[7],
          saltG: raw[8],
        }
      : null;

    const categoryId = categoryByName.get(item.category);
    if (!categoryId) throw new Error(`Unknown category: ${item.category}`);

    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (existing) {
      // Upgrade in place: the v2 report is newer and more complete. Keep the
      // existing recipe and pack weight; only fill/replace label-facing data.
      await db
        .update(products)
        .set({
          category: item.menuCategory,
          labelCategoryId: categoryId,
          description: item.description ?? existing.description,
          pricePence: item.pricePence ?? existing.pricePence,
          nutritionOverride: panel ?? existing.nutritionOverride,
          updatedAt: new Date(),
        })
        .where(eq(products.id, existing.id));
      updatedProducts++;
      continue;
    }

    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug,
        category: item.menuCategory,
        description: item.description,
        pricePence: item.pricePence,
        labelCategoryId: categoryId,
        shelfLifeValue: 2,
        shelfLifeUnit: "days",
        shelfLifeType: "use_by",
        storageInstructions: "Keep Refrigerated 5°C",
        nutritionOverride: panel,
        packWeightGrams: null,
        placeholderWeights: true,
      })
      .returning();
    newProducts++;

    // Weights descend with declaration order so the printed ingredient list
    // keeps the supplier's order (actual per-component weights are unknown).
    let weight = 100;
    for (const componentName of item.components) {
      const ingredientId = ingredientIdByName.get(componentName);
      if (!ingredientId) {
        throw new Error(`Unknown component "${componentName}" in product "${item.name}"`);
      }
      await db.insert(productIngredients).values({
        productId: product.id,
        ingredientId,
        weightGrams: weight,
      });
      weight = Math.max(weight - 5, 5);
    }
  }
  console.log(`  ${newProducts} new, ${updatedProducts} updated.`);
  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
