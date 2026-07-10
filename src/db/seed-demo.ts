// Demo/dev data: a few ingredients and one product for manual testing.
import { db } from "./index";
import { ingredients, ingredientAllergens, products, productIngredients } from "./schema";
import { eq } from "drizzle-orm";

async function upsertIngredient(
  name: string,
  nutrition: {
    energyKcal: number; energyKj: number; fatG: number; saturatesG: number;
    carbohydrateG: number; sugarsG: number; fibreG: number; proteinG: number; saltG: number;
  },
  allergenSlugs: string[]
) {
  let ing = await db.query.ingredients.findFirst({ where: eq(ingredients.name, name) });
  if (!ing) {
    [ing] = await db.insert(ingredients).values({ name, ...nutrition }).returning();
  }
  for (const slug of allergenSlugs) {
    const allergen = await db.query.allergens.findFirst({ where: (t, { eq: e }) => e(t.slug, slug) });
    if (allergen) {
      await db
        .insert(ingredientAllergens)
        .values({ ingredientId: ing.id, allergenId: allergen.id })
        .onConflictDoNothing();
    }
  }
  return ing;
}

async function main() {
  const ham = await upsertIngredient(
    "Cooked ham",
    { energyKcal: 107, energyKj: 449, fatG: 3.3, saturatesG: 1.1, carbohydrateG: 1.7, sugarsG: 1.5, fibreG: 0, proteinG: 18, saltG: 2.3 },
    []
  );
  const cheddar = await upsertIngredient(
    "Cheddar cheese",
    { energyKcal: 416, energyKj: 1725, fatG: 34.9, saturatesG: 21.7, carbohydrateG: 0.1, sugarsG: 0.1, fibreG: 0, proteinG: 25.4, saltG: 1.8 },
    ["milk"]
  );
  const butter = await upsertIngredient(
    "Butter",
    { energyKcal: 744, energyKj: 3059, fatG: 82.2, saturatesG: 52.1, carbohydrateG: 0.6, sugarsG: 0.6, fibreG: 0, proteinG: 0.6, saltG: 1.5 },
    ["milk"]
  );
  const mayo = await upsertIngredient(
    "Mayonnaise",
    { energyKcal: 721, energyKj: 2965, fatG: 79, saturatesG: 6.1, carbohydrateG: 1.3, sugarsG: 1.3, fibreG: 0, proteinG: 1.1, saltG: 1.5 },
    ["eggs", "mustard"]
  );

  const bread = await db.query.ingredients.findFirst({
    where: eq(ingredients.name, "White bread (wheat)"),
  });

  let sandwich = await db.query.products.findFirst({
    where: eq(products.slug, "ham-cheese-sandwich"),
  });
  if (!sandwich) {
    [sandwich] = await db
      .insert(products)
      .values({
        name: "Ham & Cheese Sandwich",
        slug: "ham-cheese-sandwich",
        category: "Sandwiches",
        shelfLifeValue: 2,
        shelfLifeUnit: "days",
        shelfLifeType: "use_by",
        storageInstructions: "Keep refrigerated below 5°C",
      })
      .returning();

    const recipe: Array<[number, number]> = [
      ...(bread ? ([[bread.id, 80]] as Array<[number, number]>) : []),
      [ham.id, 50],
      [cheddar.id, 30],
      [butter.id, 10],
      [mayo.id, 15],
    ];
    for (const [ingredientId, weightGrams] of recipe) {
      await db.insert(productIngredients).values({
        productId: sandwich.id,
        ingredientId,
        weightGrams,
      });
    }
  }

  console.log("Demo data ready. Product id:", sandwich.id);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
