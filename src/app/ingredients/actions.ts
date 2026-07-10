"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ingredients, ingredientAllergens } from "@/db/schema";
import { NUTRITION_FIELDS } from "@/lib/nutrition-fields";

const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  notes: z.string().trim().optional(),
  energyKcal: z.coerce.number().min(0).default(0),
  energyKj: z.coerce.number().min(0).default(0),
  fatG: z.coerce.number().min(0).default(0),
  saturatesG: z.coerce.number().min(0).default(0),
  carbohydrateG: z.coerce.number().min(0).default(0),
  sugarsG: z.coerce.number().min(0).default(0),
  fibreG: z.coerce.number().min(0).default(0),
  proteinG: z.coerce.number().min(0).default(0),
  saltG: z.coerce.number().min(0).default(0),
});

function parseIngredientForm(formData: FormData) {
  const raw: Record<string, unknown> = { name: formData.get("name"), notes: formData.get("notes") };
  for (const field of NUTRITION_FIELDS) {
    const value = formData.get(field.key);
    if (value !== null && value !== "") raw[field.key] = value;
  }
  const parsed = ingredientSchema.parse(raw);
  const allergenIds = formData
    .getAll("allergenIds")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
  return { parsed, allergenIds };
}

export async function createIngredient(formData: FormData) {
  const { parsed, allergenIds } = parseIngredientForm(formData);

  const [ingredient] = await db.insert(ingredients).values(parsed).returning({ id: ingredients.id });

  if (allergenIds.length > 0) {
    await db
      .insert(ingredientAllergens)
      .values(allergenIds.map((allergenId) => ({ ingredientId: ingredient.id, allergenId })));
  }

  revalidatePath("/ingredients");
  redirect("/ingredients");
}

export async function updateIngredient(id: number, formData: FormData) {
  const { parsed, allergenIds } = parseIngredientForm(formData);

  await db.update(ingredients).set({ ...parsed, updatedAt: new Date() }).where(eq(ingredients.id, id));

  await db.delete(ingredientAllergens).where(eq(ingredientAllergens.ingredientId, id));
  if (allergenIds.length > 0) {
    await db
      .insert(ingredientAllergens)
      .values(allergenIds.map((allergenId) => ({ ingredientId: id, allergenId })));
  }

  revalidatePath("/ingredients");
  redirect("/ingredients");
}

export async function deleteIngredient(id: number) {
  try {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  } catch {
    redirect(
      `/ingredients?error=${encodeURIComponent(
        "This ingredient is used in one or more product recipes and can't be deleted. Remove it from those recipes first."
      )}`
    );
  }
  revalidatePath("/ingredients");
  redirect("/ingredients");
}
