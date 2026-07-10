"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { labelCategories, brandTemplates } from "@/db/schema";

const MAX_LOGO_BYTES = 500 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg"];

function fail(message: string): never {
  redirect(`/labels/template?error=${encodeURIComponent(message)}`);
}

async function readLogo(formData: FormData): Promise<string | undefined> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return undefined;
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    fail("Logo must be a PNG or JPEG image.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    fail("Logo must be under 500KB — try a smaller image.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function createBrandTemplate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) fail("Template name is required.");

  const existing = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.name, name),
  });
  if (existing) fail(`A template called "${name}" already exists.`);

  const logoDataUrl = await readLogo(formData);
  const count = await db.$count(brandTemplates);

  await db.insert(brandTemplates).values({
    name,
    businessName: String(formData.get("businessName") ?? "").trim() || null,
    businessAddress: String(formData.get("businessAddress") ?? "").trim() || null,
    logoDataUrl: logoDataUrl ?? null,
    labelSizeId: Number(formData.get("labelSizeId")) || null,
    isDefault: count === 0,
    showStars: formData.get("showStars") === "on",
    tintLogo: formData.get("tintLogo") === "on",
    innerBorder: formData.get("innerBorder") === "on",
  });

  revalidatePath("/labels/template");
  redirect("/labels/template?saved=1");
}

export async function updateBrandTemplate(id: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) fail("Template name is required.");

  const logoDataUrl = await readLogo(formData);

  await db
    .update(brandTemplates)
    .set({
      name,
      businessName: String(formData.get("businessName") ?? "").trim() || null,
      businessAddress: String(formData.get("businessAddress") ?? "").trim() || null,
      labelSizeId: Number(formData.get("labelSizeId")) || null,
      showStars: formData.get("showStars") === "on",
      tintLogo: formData.get("tintLogo") === "on",
      innerBorder: formData.get("innerBorder") === "on",
      ...(logoDataUrl ? { logoDataUrl } : {}),
    })
    .where(eq(brandTemplates.id, id));

  revalidatePath("/labels/template");
  redirect("/labels/template?saved=1");
}

export async function removeBrandLogo(id: number) {
  await db.update(brandTemplates).set({ logoDataUrl: null }).where(eq(brandTemplates.id, id));
  revalidatePath("/labels/template");
  redirect("/labels/template");
}

export async function setDefaultBrandTemplate(id: number) {
  await db.transaction(async (tx) => {
    await tx.update(brandTemplates).set({ isDefault: false });
    await tx.update(brandTemplates).set({ isDefault: true }).where(eq(brandTemplates.id, id));
  });
  revalidatePath("/labels/template");
  redirect("/labels/template");
}

export async function deleteBrandTemplate(id: number) {
  const row = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.id, id),
  });
  if (!row) redirect("/labels/template");
  if (row.isDefault) fail("Make another template the default before deleting this one.");

  try {
    await db.delete(brandTemplates).where(eq(brandTemplates.id, id));
  } catch {
    // Referenced by past print runs or standing orders — keep history intact.
    fail("This template is used by past print runs or standing orders, so it can't be deleted.");
  }
  revalidatePath("/labels/template");
  redirect("/labels/template");
}

export async function updateCategoryColor(id: number, formData: FormData) {
  const colorHex = String(formData.get("colorHex") ?? "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) fail("Invalid colour.");
  await db.update(labelCategories).set({ colorHex }).where(eq(labelCategories.id, id));
  revalidatePath("/labels/template");
  redirect("/labels/template?saved=1");
}

export async function addCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const colorHex = String(formData.get("colorHex") ?? "").trim();
  if (!name) fail("Category name is required.");
  if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) fail("Invalid colour.");
  const maxSort = await db.query.labelCategories.findMany({
    orderBy: (t, { desc }) => desc(t.sortOrder),
    limit: 1,
  });
  await db
    .insert(labelCategories)
    .values({ name, colorHex, sortOrder: (maxSort[0]?.sortOrder ?? 0) + 1 })
    .onConflictDoNothing();
  revalidatePath("/labels/template");
  redirect("/labels/template?saved=1");
}
