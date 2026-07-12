import { db } from "@/db";
import { products } from "@/db/schema";
import { inArray } from "drizzle-orm";
import {
  deriveProduct,
  type RecipeIngredient,
  type IngredientNutrition,
} from "./nutrition";

const productWith = {
  productIngredients: {
    with: {
      ingredient: {
        with: { ingredientAllergens: { with: { allergen: true } } },
      },
    },
  },
  defaultLabelSize: true,
  labelCategory: true,
} as const;

type LoadedProduct = Awaited<
  ReturnType<typeof db.query.products.findFirst<{ with: typeof productWith }>>
>;

export type DerivedLoaded = {
  product: NonNullable<LoadedProduct>;
  derived: ReturnType<typeof deriveProduct>;
  allergenNamesBySlug: Map<string, string>;
};

/**
 * Loads a product with its recipe joined to ingredients and allergens, and
 * returns both the raw rows and the derived (Natasha's Law) view. Every part
 * of the app that needs a product's ingredient list, allergens, or nutrition
 * must go through this so the derivation logic stays in one place.
 */
export async function loadProductWithDerived(productId: number) {
  const product = await db.query.products.findFirst({
    where: (t, { eq }) => eq(t.id, productId),
    with: productWith,
  });

  if (!product) return null;
  return deriveLoadedProduct(product);
}

/**
 * Batch version of loadProductWithDerived: loads many products in a single
 * query and derives each. Used by the print run so a large list is one DB
 * round-trip instead of one per product (a big speed win on a remote DB).
 */
export async function loadProductsWithDerived(
  ids: number[]
): Promise<Map<number, DerivedLoaded>> {
  if (ids.length === 0) return new Map();
  const rows = await db.query.products.findMany({
    where: inArray(products.id, Array.from(new Set(ids))),
    with: productWith,
  });
  return new Map(rows.map((p) => [p.id, deriveLoadedProduct(p)]));
}

/** Derives the Natasha's Law view for one already-loaded product row. */
function deriveLoadedProduct(product: NonNullable<LoadedProduct>): DerivedLoaded {
  const recipe: RecipeIngredient[] = product.productIngredients.map((pi) => ({
    ingredientId: pi.ingredientId,
    name: pi.ingredient.name,
    labelDeclaration: pi.ingredient.labelDeclaration,
    weightGrams: pi.weightGrams,
    allergenSlugs: pi.ingredient.ingredientAllergens.map((ia) => ia.allergen.slug),
    nutritionPer100g: {
      energyKcal: pi.ingredient.energyKcal,
      energyKj: pi.ingredient.energyKj,
      fatG: pi.ingredient.fatG,
      saturatesG: pi.ingredient.saturatesG,
      carbohydrateG: pi.ingredient.carbohydrateG,
      sugarsG: pi.ingredient.sugarsG,
      fibreG: pi.ingredient.fibreG,
      proteinG: pi.ingredient.proteinG,
      saltG: pi.ingredient.saltG,
    },
  }));

  // slug -> display name for every allergen present in the recipe
  const allergenNamesBySlug = new Map<string, string>();
  for (const pi of product.productIngredients) {
    for (const ia of pi.ingredient.ingredientAllergens) {
      allergenNamesBySlug.set(ia.allergen.slug, ia.allergen.name);
    }
  }

  const derived = deriveProduct(recipe);

  // Supplier-provided finished-product nutrition beats the recipe-derived sum
  // (used when per-ingredient nutrition isn't known, e.g. imported catalogues).
  if (product.nutritionOverride) {
    derived.nutritionPer100g = product.nutritionOverride as IngredientNutrition;
    // With an override the recipe weights are placeholders, so the summed
    // weight is meaningless: use the supplier pack weight or nothing (0 makes
    // the label render per-100g only).
    derived.totalWeightGrams =
      product.packWeightGrams != null && product.packWeightGrams > 0
        ? product.packWeightGrams
        : 0;
  } else if (product.placeholderWeights) {
    // Imported recipe whose weights only encode ingredient order, and no
    // supplier panel either: deriving nutrition from those fake weights would
    // print wrong numbers, so zero it out (the label then omits the table).
    derived.nutritionPer100g = {
      energyKcal: 0, energyKj: 0, fatG: 0, saturatesG: 0, carbohydrateG: 0,
      sugarsG: 0, fibreG: 0, proteinG: 0, saltG: 0,
    };
    derived.totalWeightGrams =
      product.packWeightGrams != null && product.packWeightGrams > 0
        ? product.packWeightGrams
        : 0;
  } else if (product.packWeightGrams != null && product.packWeightGrams > 0) {
    derived.totalWeightGrams = product.packWeightGrams;
  }

  return { product, derived, allergenNamesBySlug };
}
