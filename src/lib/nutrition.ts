export type IngredientNutrition = {
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

export type RecipeIngredient = {
  ingredientId: number;
  name: string;
  /** Compound declaration printed on labels instead of `name` when present. */
  labelDeclaration?: string | null;
  weightGrams: number;
  allergenSlugs: string[];
  nutritionPer100g: IngredientNutrition;
};

export type DerivedIngredientLine = {
  name: string;
  /** What actually prints on the label: declaration if set, else the name. */
  labelText: string;
  weightGrams: number;
  isAllergen: boolean;
  allergenSlugs: string[];
};

export type DerivedProduct = {
  /** Ingredient list in the order required by Natasha's Law: descending by weight. */
  ingredients: DerivedIngredientLine[];
  /** Union of every allergen slug present anywhere in the recipe. */
  allergenSlugs: string[];
  totalWeightGrams: number;
  nutritionPer100g: IngredientNutrition;
};

const NUTRITION_KEYS = [
  "energyKcal",
  "energyKj",
  "fatG",
  "saturatesG",
  "carbohydrateG",
  "sugarsG",
  "fibreG",
  "proteinG",
  "saltG",
] as const;

const zeroNutrition = (): IngredientNutrition => ({
  energyKcal: 0,
  energyKj: 0,
  fatG: 0,
  saturatesG: 0,
  carbohydrateG: 0,
  sugarsG: 0,
  fibreG: 0,
  proteinG: 0,
  saltG: 0,
});

/**
 * Derives everything Natasha's Law and a nutrition panel require from a
 * product's recipe (ingredient + weight pairs). This is the single source of
 * truth for ingredient ordering, allergen emphasis, and nutrition — both the
 * on-screen preview and the printed PDF must call this, never recompute
 * independently, so the two can never drift apart.
 */
export function deriveProduct(recipe: RecipeIngredient[]): DerivedProduct {
  const totalWeightGrams = recipe.reduce((sum, r) => sum + r.weightGrams, 0);

  // Descending by weight, per Natasha's Law ordering requirement. Ties break
  // alphabetically by name for a stable, predictable order.
  const sorted = [...recipe].sort((a, b) => {
    if (b.weightGrams !== a.weightGrams) return b.weightGrams - a.weightGrams;
    return a.name.localeCompare(b.name);
  });

  const ingredients: DerivedIngredientLine[] = sorted.map((r) => ({
    name: r.name,
    labelText: r.labelDeclaration?.trim() || r.name,
    weightGrams: r.weightGrams,
    isAllergen: r.allergenSlugs.length > 0,
    allergenSlugs: r.allergenSlugs,
  }));

  const allergenSlugs = Array.from(
    new Set(recipe.flatMap((r) => r.allergenSlugs))
  ).sort();

  const totals = zeroNutrition();
  for (const r of recipe) {
    const scale = r.weightGrams / 100;
    for (const key of NUTRITION_KEYS) {
      totals[key] += r.nutritionPer100g[key] * scale;
    }
  }

  const nutritionPer100g = zeroNutrition();
  if (totalWeightGrams > 0) {
    const scale = 100 / totalWeightGrams;
    for (const key of NUTRITION_KEYS) {
      nutritionPer100g[key] = totals[key] * scale;
    }
  }

  return { ingredients, allergenSlugs, totalWeightGrams, nutritionPer100g };
}
