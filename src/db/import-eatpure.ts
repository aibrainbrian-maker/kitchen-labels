// One-shot import of the Eatpure sandwich catalogue. Idempotent: existing
// ingredients (by name) and products (by slug) are left untouched, so it can
// be re-run safely. Run with: npm run db:import-eatpure
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  ingredients,
  ingredientAllergens,
  products,
  productIngredients,
} from "./schema";
import { COMPONENTS } from "./import-eatpure-components";
import { CATALOGUE } from "./import-eatpure-products";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const allergenRows = await db.query.allergens.findMany();
  const allergenBySlug = new Map(allergenRows.map((a) => [a.slug, a.id]));
  const categoryRows = await db.query.labelCategories.findMany();
  const categoryByName = new Map(categoryRows.map((c) => [c.name, c.id]));

  // 1. Component ingredients
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
  console.log(`Importing ${CATALOGUE.length} products...`);
  let newProducts = 0;

  for (const item of CATALOGUE) {
    const slug = slugify(item.name);
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });
    if (existing) continue;

    // Panels from the report that only carried energy/fat (carbs, protein and
    // salt all zero) are treated as "no data": better to omit the nutrition
    // table than print misleading zeros.
    const isPartial =
      item.nutrition != null && item.nutrition.slice(4).every((v) => v === 0);
    const panel = item.nutrition && !isPartial ? item.nutrition : null;

    const categoryId = categoryByName.get(item.category);
    if (!categoryId) throw new Error(`Unknown category: ${item.category}`);

    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug,
        category: "Sandwiches",
        description: item.description,
        pricePence: item.pricePence,
        labelCategoryId: categoryId,
        shelfLifeValue: 2,
        shelfLifeUnit: "days",
        shelfLifeType: "use_by",
        storageInstructions: "Keep Refrigerated 5°C",
        nutritionOverride: panel
          ? {
              energyKcal: panel[0],
              energyKj: panel[1],
              fatG: panel[2],
              saturatesG: panel[3],
              carbohydrateG: panel[4],
              sugarsG: panel[5],
              fibreG: panel[6],
              proteinG: panel[7],
              saltG: panel[8],
            }
          : null,
        packWeightGrams: item.packG,
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
  console.log(`  ${newProducts} new, ${CATALOGUE.length - newProducts} already existed.`);
  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
