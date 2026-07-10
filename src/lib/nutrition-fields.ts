export const NUTRITION_FIELDS = [
  { key: "energyKcal", label: "Energy", unit: "kcal" },
  { key: "energyKj", label: "Energy", unit: "kJ" },
  { key: "fatG", label: "Fat", unit: "g" },
  { key: "saturatesG", label: "of which saturates", unit: "g" },
  { key: "carbohydrateG", label: "Carbohydrate", unit: "g" },
  { key: "sugarsG", label: "of which sugars", unit: "g" },
  { key: "fibreG", label: "Fibre", unit: "g" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "saltG", label: "Salt", unit: "g" },
] as const;

export type NutritionFieldKey = (typeof NUTRITION_FIELDS)[number]["key"];
