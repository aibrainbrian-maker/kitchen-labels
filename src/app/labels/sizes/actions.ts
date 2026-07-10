"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { labelSizes } from "@/db/schema";

const sizeSchema = z
  .object({
    name: z.string().trim().min(1),
    widthMm: z.coerce.number().positive(),
    heightMm: z.coerce.number().positive(),
    cols: z.coerce.number().int().min(1),
    rows: z.coerce.number().int().min(1),
    marginTopMm: z.coerce.number().min(0).default(0),
    marginLeftMm: z.coerce.number().min(0).default(0),
    gapXMm: z.coerce.number().min(0).default(0),
    gapYMm: z.coerce.number().min(0).default(0),
  })
  .refine(
    (v) => v.marginLeftMm + v.cols * v.widthMm + (v.cols - 1) * v.gapXMm <= 210.01,
    { message: "Grid is wider than an A4 sheet (210mm) — check columns, width, gaps and margin." }
  )
  .refine(
    (v) => v.marginTopMm + v.rows * v.heightMm + (v.rows - 1) * v.gapYMm <= 297.01,
    { message: "Grid is taller than an A4 sheet (297mm) — check rows, height, gaps and margin." }
  );

export async function createLabelSize(formData: FormData) {
  const parsed = sizeSchema.safeParse({
    name: formData.get("name"),
    widthMm: formData.get("widthMm"),
    heightMm: formData.get("heightMm"),
    cols: formData.get("cols"),
    rows: formData.get("rows"),
    marginTopMm: formData.get("marginTopMm") || 0,
    marginLeftMm: formData.get("marginLeftMm") || 0,
    gapXMm: formData.get("gapXMm") || 0,
    gapYMm: formData.get("gapYMm") || 0,
  });

  if (!parsed.success) {
    redirect(
      `/labels/sizes?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  await db.insert(labelSizes).values({
    ...parsed.data,
    kind: "sheet_grid",
    isCustom: true,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
  });

  revalidatePath("/labels/sizes");
  redirect("/labels/sizes");
}

export async function setLabelSizeActive(id: number, isActive: boolean) {
  await db.update(labelSizes).set({ isActive }).where(eq(labelSizes.id, id));
  revalidatePath("/labels/sizes");
}
