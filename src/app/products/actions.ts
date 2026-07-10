"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products, productIngredients } from "@/db/schema";
import { slugify } from "@/lib/slug";

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().optional(),
  description: z.string().trim().optional(),
  shelfLifeValue: z.coerce.number().int().min(1),
  shelfLifeUnit: z.enum(["hours", "days", "weeks"]),
  shelfLifeType: z.enum(["use_by", "best_before"]),
  storageInstructions: z.string().trim().optional(),
  defaultLabelSizeId: z.coerce.number().optional(),
  labelCategoryId: z.coerce.number().nullable().optional(),
  pricePence: z.number().int().min(0).nullable().optional(),
});

function parseProductForm(formData: FormData) {
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    category: formData.get("category") || undefined,
    description: formData.get("description") || undefined,
    shelfLifeValue: formData.get("shelfLifeValue"),
    shelfLifeUnit: formData.get("shelfLifeUnit"),
    shelfLifeType: formData.get("shelfLifeType"),
    storageInstructions: formData.get("storageInstructions") || undefined,
  };
  const labelSizeId = formData.get("defaultLabelSizeId");
  if (labelSizeId) raw.defaultLabelSizeId = labelSizeId;

  const categoryId = formData.get("labelCategoryId");
  raw.labelCategoryId = categoryId ? Number(categoryId) : null;

  // Price entered in pounds (e.g. "3.80"), stored as integer pence
  const pricePounds = formData.get("pricePounds");
  raw.pricePence =
    pricePounds && String(pricePounds).trim() !== ""
      ? Math.round(parseFloat(String(pricePounds)) * 100)
      : null;

  return productSchema.parse(raw);
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const baseSlug = slugify(base) || "product";
  let candidate = baseSlug;
  let n = 2;
  for (;;) {
    const existing = await db.query.products.findFirst({
      where: (t, { eq: eqOp, and: andOp, ne }) =>
        excludeId
          ? andOp(eqOp(t.slug, candidate), ne(t.id, excludeId))
          : eqOp(t.slug, candidate),
    });
    if (!existing) return candidate;
    candidate = `${baseSlug}-${n}`;
    n += 1;
  }
}

export async function createProduct(formData: FormData) {
  const parsed = parseProductForm(formData);
  const slug = await uniqueSlug(parsed.name);

  const [product] = await db
    .insert(products)
    .values({ ...parsed, slug })
    .returning({ id: products.id });

  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

export async function updateProduct(id: number, formData: FormData) {
  const parsed = parseProductForm(formData);
  const slug = await uniqueSlug(parsed.name, id);

  await db
    .update(products)
    .set({ ...parsed, slug, updatedAt: new Date() })
    .where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}`);
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/products");
  redirect("/products");
}

export async function toggleFavorite(id: number, isFavorite: boolean) {
  await db.update(products).set({ isFavorite }).where(eq(products.id, id));
  revalidatePath("/products");
  revalidatePath("/");
}

const recipeLineSchema = z.object({
  ingredientId: z.coerce.number().int().positive(),
  weightGrams: z.coerce.number().positive("Weight must be greater than 0"),
});

export async function addRecipeIngredient(productId: number, formData: FormData) {
  const parsed = recipeLineSchema.parse({
    ingredientId: formData.get("ingredientId"),
    weightGrams: formData.get("weightGrams"),
  });

  const existing = await db.query.productIngredients.findFirst({
    where: and(
      eq(productIngredients.productId, productId),
      eq(productIngredients.ingredientId, parsed.ingredientId)
    ),
  });

  if (existing) {
    await db
      .update(productIngredients)
      .set({ weightGrams: existing.weightGrams + parsed.weightGrams })
      .where(eq(productIngredients.id, existing.id));
  } else {
    await db.insert(productIngredients).values({ productId, ...parsed });
  }

  revalidatePath(`/products/${productId}`);
}

export async function removeRecipeIngredient(productId: number, lineId: number) {
  await db.delete(productIngredients).where(eq(productIngredients.id, lineId));
  revalidatePath(`/products/${productId}`);
}

/**
 * Switch an imported product to recipe-derived nutrition: drops the supplier
 * panel and the placeholder-weights flag, so from now on the label calculates
 * from the ingredient weights. Only do this after the weights are real.
 */
export async function useRecipeNutrition(productId: number) {
  await db
    .update(products)
    .set({
      nutritionOverride: null,
      placeholderWeights: false,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/preview`);
}
