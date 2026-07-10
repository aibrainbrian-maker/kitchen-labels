import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveProduct, type RecipeIngredient } from "./nutrition";

const nutrition = (kcal: number, salt = 0) => ({
  energyKcal: kcal,
  energyKj: kcal * 4.184,
  fatG: 0,
  saturatesG: 0,
  carbohydrateG: 0,
  sugarsG: 0,
  fibreG: 0,
  proteinG: 0,
  saltG: salt,
});

const ing = (
  id: number,
  name: string,
  weightGrams: number,
  allergenSlugs: string[] = [],
  kcalPer100 = 100
): RecipeIngredient => ({
  ingredientId: id,
  name,
  weightGrams,
  allergenSlugs,
  nutritionPer100g: nutrition(kcalPer100),
});

test("ingredients are ordered by descending weight (Natasha's Law)", () => {
  const derived = deriveProduct([
    ing(1, "Butter", 10),
    ing(2, "Bread", 80, ["cereals-containing-gluten"]),
    ing(3, "Ham", 50),
  ]);
  assert.deepEqual(
    derived.ingredients.map((i) => i.name),
    ["Bread", "Ham", "Butter"]
  );
});

test("equal weights break ties alphabetically for stable output", () => {
  const derived = deriveProduct([
    ing(1, "Zucchini", 20),
    ing(2, "Apple", 20),
  ]);
  assert.deepEqual(
    derived.ingredients.map((i) => i.name),
    ["Apple", "Zucchini"]
  );
});

test("allergens are the union across ingredients, deduplicated and sorted", () => {
  const derived = deriveProduct([
    ing(1, "Bread", 80, ["cereals-containing-gluten"]),
    ing(2, "Cheese", 30, ["milk"]),
    ing(3, "Butter", 10, ["milk"]),
    ing(4, "Mayo", 15, ["eggs", "mustard"]),
  ]);
  assert.deepEqual(derived.allergenSlugs, [
    "cereals-containing-gluten",
    "eggs",
    "milk",
    "mustard",
  ]);
});

test("isAllergen flag set exactly when the ingredient carries any allergen", () => {
  const derived = deriveProduct([
    ing(1, "Bread", 80, ["cereals-containing-gluten"]),
    ing(2, "Ham", 50),
  ]);
  assert.equal(derived.ingredients[0].isAllergen, true);
  assert.equal(derived.ingredients[1].isAllergen, false);
});

test("nutrition aggregates by weight and normalizes per 100g", () => {
  // 100g of A (100kcal/100g) + 100g of B (300kcal/100g)
  // total = 100 + 300 = 400kcal over 200g -> 200kcal per 100g
  const derived = deriveProduct([
    ing(1, "A", 100, [], 100),
    ing(2, "B", 100, [], 300),
  ]);
  assert.equal(derived.totalWeightGrams, 200);
  assert.equal(derived.nutritionPer100g.energyKcal, 200);
});

test("hand-checked sandwich example matches manual calculation", () => {
  // bread 80g @265, ham 50g @107, cheddar 30g @416, butter 10g @744, mayo 15g @721
  const recipe: RecipeIngredient[] = [
    ing(1, "Bread", 80, [], 265),
    ing(2, "Ham", 50, [], 107),
    ing(3, "Cheddar", 30, [], 416),
    ing(4, "Butter", 10, [], 744),
    ing(5, "Mayo", 15, [], 721),
  ];
  const derived = deriveProduct(recipe);
  // manual: 212 + 53.5 + 124.8 + 74.4 + 108.15 = 572.85 kcal over 185g
  const perPack = (derived.nutritionPer100g.energyKcal * derived.totalWeightGrams) / 100;
  assert.ok(Math.abs(perPack - 572.85) < 0.01, `perPack was ${perPack}`);
  assert.ok(Math.abs(derived.nutritionPer100g.energyKcal - 309.65) < 0.01);
});

test("empty recipe yields empty derivation without dividing by zero", () => {
  const derived = deriveProduct([]);
  assert.equal(derived.totalWeightGrams, 0);
  assert.equal(derived.nutritionPer100g.energyKcal, 0);
  assert.deepEqual(derived.ingredients, []);
  assert.deepEqual(derived.allergenSlugs, []);
});
