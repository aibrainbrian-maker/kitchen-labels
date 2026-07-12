"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  printRuns,
  printRunItems,
  products,
  standingOrders,
  standingOrderItems,
} from "@/db/schema";
import { loadProductsWithDerived } from "@/lib/product-data";
import { buildLabelContent } from "@/lib/labels/label-content";
import { getBrandContext } from "@/lib/brand";

const runSchema = z.object({
  labelSizeId: z.coerce.number().int().positive(),
  brandTemplateId: z.coerce.number().int().positive().optional(),
  standingOrderId: z.coerce.number().int().positive().optional(),
  prepDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startAtPosition: z.coerce.number().int().min(1).default(1),
  printedBy: z.string().trim().optional(),
});

function collectQuantities(formData: FormData) {
  const lines: Array<{ productId: number; quantity: number }> = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^qty_(\d+)$/);
    if (!match) continue;
    const quantity = Number(value);
    if (Number.isFinite(quantity) && quantity > 0) {
      lines.push({ productId: Number(match[1]), quantity: Math.floor(quantity) });
    }
  }
  return lines;
}

export type PrintRunResult = { runId?: number; error?: string };

export async function executePrintRun(formData: FormData): Promise<PrintRunResult> {
  const parsed = runSchema.parse({
    labelSizeId: formData.get("labelSizeId"),
    brandTemplateId: formData.get("brandTemplateId") || undefined,
    standingOrderId: formData.get("standingOrderId") || undefined,
    prepDate: formData.get("prepDate"),
    startAtPosition: formData.get("startAtPosition") || 1,
    printedBy: formData.get("printedBy") || undefined,
  });

  const lines = collectQuantities(formData);

  if (lines.length === 0) {
    return { error: "Set a quantity for at least one product." };
  }

  // Prep date interpreted as midday local to avoid timezone edge cases
  const prepDate = new Date(`${parsed.prepDate}T12:00:00`);

  const settings = await getBrandContext(parsed.brandTemplateId);

  // Customer-specific label prices from the standing order this run was
  // loaded from (some standing-order customers pay non-catalogue prices).
  const priceOverrideByProduct = new Map<number, number>();
  if (parsed.standingOrderId != null) {
    const orderItems = await db.query.standingOrderItems.findMany({
      where: eq(standingOrderItems.standingOrderId, parsed.standingOrderId),
    });
    for (const item of orderItems) {
      if (item.pricePenceOverride != null) {
        priceOverrideByProduct.set(item.productId, item.pricePenceOverride);
      }
    }
  }

  // Load every product in one query (not one per line — big win on a remote DB)
  const loadedById = await loadProductsWithDerived(lines.map((l) => l.productId));

  // Snapshot every line's label content BEFORE writing anything
  const snapshots: Array<{
    line: { productId: number; quantity: number };
    content: ReturnType<typeof buildLabelContent>;
  }> = [];
  for (const line of lines) {
    const loaded = loadedById.get(line.productId);
    if (!loaded) continue;
    if (loaded.derived.ingredients.length === 0) {
      return {
        error: `"${loaded.product.name}" has no recipe yet — add ingredients before printing its label.`,
      };
    }
    const content = buildLabelContent({
      productName: loaded.product.name,
      derived: loaded.derived,
      allergenNamesBySlug: loaded.allergenNamesBySlug,
      shelfLifeValue: loaded.product.shelfLifeValue,
      shelfLifeUnit: loaded.product.shelfLifeUnit,
      shelfLifeType: loaded.product.shelfLifeType,
      storageInstructions: loaded.product.storageInstructions,
      prepDate,
      description: loaded.product.description,
      // Override 0 = this customer's labels print no price at all
      pricePence:
        priceOverrideByProduct.get(line.productId) === 0
          ? null
          : priceOverrideByProduct.get(line.productId) ?? loaded.product.pricePence,
      // A brand-level border colour (e.g. Surfin's black frame) beats the
      // product category colour.
      categoryColorHex:
        settings.borderColorHex ?? loaded.product.labelCategory?.colorHex ?? null,
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      showStars: settings.showStars,
      innerBorder: settings.innerBorder,
    });
    snapshots.push({ line, content });
  }

  if (snapshots.length === 0) {
    return { error: "No valid products selected." };
  }

  const runId = await db.transaction(async (tx) => {
    const [run] = await tx
      .insert(printRuns)
      .values({
        labelSizeId: parsed.labelSizeId,
        brandTemplateId: settings.id,
        startAtPosition: parsed.startAtPosition,
        printedBy: parsed.printedBy || null,
      })
      .returning({ id: printRuns.id });

    // One bulk insert for all label snapshots (not one round-trip per label).
    await tx.insert(printRunItems).values(
      snapshots.map(({ line, content }) => ({
        printRunId: run.id,
        productId: line.productId,
        quantity: line.quantity,
        prepDate: content.prepDateIso,
        computedExpiryDate: content.expiryDateIso,
        productNameSnapshot: content.productName,
        ingredientsSnapshot: content.ingredients,
        allergensSnapshot: content.allergenNames,
        nutritionSnapshot: {
          per100g: content.nutritionPer100g,
          totalWeightGrams: content.totalWeightGrams,
          dateLabel: content.dateLabel,
          dateValue: content.dateValue,
          storageInstructions: content.storageInstructions,
          description: content.description,
          priceFormatted: content.priceFormatted,
          categoryColorHex: content.categoryColorHex,
          businessName: content.businessName,
          businessAddress: content.businessAddress,
          showStars: content.showStars,
          innerBorder: content.innerBorder,
        },
      }))
    );

    // Bump every product's print_count in a single statement.
    const counts = sql.join(
      snapshots.map(
        ({ line }) => sql`(${line.productId}::int, ${line.quantity}::int)`
      ),
      sql`, `
    );
    await tx.execute(sql`
      UPDATE ${products} AS p
      SET print_count = p.print_count + v.q
      FROM (VALUES ${counts}) AS v(id, q)
      WHERE p.id = v.id
    `);

    return run.id;
  });

  revalidatePath("/print/history");
  revalidatePath("/");
  // Return the run id; the client opens /api/print/<id>/pdf in a new tab so the
  // app stays put. The run is saved to history either way.
  return { runId };
}

/**
 * Saves the current print list (quantities + sheet + branding) as a named
 * standing order. Re-saving with the same name replaces the previous list.
 */
export async function saveStandingOrder(formData: FormData) {
  const name = String(formData.get("standingOrderName") ?? "").trim();
  if (!name) {
    redirect(`/print?error=${encodeURIComponent("Give the standing order a name before saving.")}`);
  }

  const lines = collectQuantities(formData);
  if (lines.length === 0) {
    redirect(`/print?error=${encodeURIComponent("Set a quantity for at least one product before saving.")}`);
  }

  const labelSizeId = Number(formData.get("labelSizeId")) || null;
  const brandTemplateId = Number(formData.get("brandTemplateId")) || null;

  await db.transaction(async (tx) => {
    const existing = await tx.query.standingOrders.findFirst({
      where: eq(standingOrders.name, name),
    });
    let orderId: number;
    // Customer-specific prices survive a re-save: the print form doesn't carry
    // them, so carry each product's override forward from the previous items.
    const oldOverrides = new Map<number, number>();
    if (existing) {
      const oldItems = await tx.query.standingOrderItems.findMany({
        where: eq(standingOrderItems.standingOrderId, existing.id),
      });
      for (const item of oldItems) {
        if (item.pricePenceOverride != null) {
          oldOverrides.set(item.productId, item.pricePenceOverride);
        }
      }
      await tx
        .update(standingOrders)
        .set({ labelSizeId, brandTemplateId })
        .where(eq(standingOrders.id, existing.id));
      await tx
        .delete(standingOrderItems)
        .where(eq(standingOrderItems.standingOrderId, existing.id));
      orderId = existing.id;
    } else {
      const [created] = await tx
        .insert(standingOrders)
        .values({ name, labelSizeId, brandTemplateId })
        .returning({ id: standingOrders.id });
      orderId = created.id;
    }
    for (const line of lines) {
      await tx.insert(standingOrderItems).values({
        standingOrderId: orderId,
        productId: line.productId,
        quantity: line.quantity,
        pricePenceOverride: oldOverrides.get(line.productId) ?? null,
      });
    }
  });

  revalidatePath("/print");
  redirect("/print?savedOrder=1");
}

export async function deleteStandingOrder(id: number, redirectTo = "/print") {
  await db.delete(standingOrders).where(eq(standingOrders.id, id));
  revalidatePath("/print");
  revalidatePath("/");
  redirect(redirectTo);
}

/** Returns a standing-order name not yet taken, suffixing " (n)" if needed. */
async function uniqueStandingOrderName(base: string, excludeId?: number): Promise<string> {
  for (let n = 0; ; n++) {
    const candidate = n === 0 ? base : `${base} (${n + 1})`;
    const existing = await db.query.standingOrders.findFirst({
      where: (t, { eq: eqOp }) => eqOp(t.name, candidate),
    });
    if (!existing || existing.id === excludeId) return candidate;
  }
}

/** Duplicates a standing order (branding, sheet, items + price overrides). */
export async function copyStandingOrder(id: number, redirectTo = "/print") {
  const source = await db.query.standingOrders.findFirst({
    where: eq(standingOrders.id, id),
    with: { items: true },
  });
  if (!source) redirect(redirectTo);

  const name = await uniqueStandingOrderName(`${source.name} (copy)`);
  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(standingOrders)
      .values({
        name,
        labelSizeId: source.labelSizeId,
        brandTemplateId: source.brandTemplateId,
      })
      .returning({ id: standingOrders.id });
    for (const item of source.items) {
      await tx.insert(standingOrderItems).values({
        standingOrderId: created.id,
        productId: item.productId,
        quantity: item.quantity,
        pricePenceOverride: item.pricePenceOverride,
      });
    }
  });

  revalidatePath("/print");
  revalidatePath("/");
  redirect(redirectTo);
}

/** Renames a standing order (uniquifies if the new name is already taken). */
export async function renameStandingOrder(id: number, rawName: string) {
  const trimmed = rawName.trim();
  if (!trimmed) return;
  const name = await uniqueStandingOrderName(trimmed, id);
  await db.update(standingOrders).set({ name }).where(eq(standingOrders.id, id));
  revalidatePath("/print");
  revalidatePath("/");
}
