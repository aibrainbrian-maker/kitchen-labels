import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  renderLabelSheetPdf,
  type SheetGridSpec,
  type LabelInstance,
} from "@/lib/labels/pdf-generator";
import type { LabelContent, LabelIngredientToken } from "@/lib/labels/label-content";
import { getBrandContext } from "@/lib/brand";
import { tintPngDataUrl } from "@/lib/labels/tint-logo";

// Labels are rendered from the run's snapshots, never from live product data,
// so a reprint is always byte-identical to the original run.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const run = await db.query.printRuns.findFirst({
    where: (t, { eq }) => eq(t.id, Number(runId)),
    with: { items: true, labelSize: true },
  });

  if (!run) {
    return NextResponse.json({ error: "Print run not found" }, { status: 404 });
  }

  const ls = run.labelSize;
  if (
    ls.kind !== "sheet_grid" ||
    ls.sheetWidthMm == null ||
    ls.sheetHeightMm == null ||
    ls.cols == null ||
    ls.rows == null
  ) {
    return NextResponse.json(
      { error: "This label size is not a printable sheet layout" },
      { status: 400 }
    );
  }

  const spec: SheetGridSpec = {
    sheetWidthMm: ls.sheetWidthMm,
    sheetHeightMm: ls.sheetHeightMm,
    labelWidthMm: ls.widthMm,
    labelHeightMm: ls.heightMm,
    cols: ls.cols,
    rows: ls.rows,
    marginTopMm: ls.marginTopMm ?? 0,
    marginLeftMm: ls.marginLeftMm ?? 0,
    gapXMm: ls.gapXMm ?? 0,
    gapYMm: ls.gapYMm ?? 0,
    template: ls.template,
  };

  // Logo comes from the run's brand template (not snapshotted per-run to
  // avoid duplicating image data); everything else comes from the run's
  // immutable snapshots.
  const settings = await getBrandContext(run.brandTemplateId);

  const instances: LabelInstance[] = [];
  for (const item of run.items) {
    const nutrition = item.nutritionSnapshot as {
      per100g: LabelContent["nutritionPer100g"];
      totalWeightGrams: number;
      dateLabel: string;
      dateValue: string;
      storageInstructions: string | null;
      description?: string | null;
      priceFormatted?: string | null;
      categoryColorHex?: string | null;
      businessName?: string | null;
      businessAddress?: string | null;
      showStars?: boolean;
      innerBorder?: boolean;
    };

    // LabelLogic-style theming: some brands print their logo recoloured to
    // the label's category colour.
    const logo =
      settings.tintLogo && settings.logoDataUrl && nutrition.categoryColorHex
        ? tintPngDataUrl(settings.logoDataUrl, nutrition.categoryColorHex)
        : settings.logoDataUrl;

    const content: LabelContent = {
      productName: item.productNameSnapshot,
      ingredients: item.ingredientsSnapshot as LabelIngredientToken[],
      allergenNames: item.allergensSnapshot as string[],
      dateLabel: nutrition.dateLabel,
      dateValue: nutrition.dateValue,
      expiryDateIso: item.computedExpiryDate,
      prepDateIso: item.prepDate,
      storageInstructions: nutrition.storageInstructions,
      nutritionPer100g: nutrition.per100g,
      totalWeightGrams: nutrition.totalWeightGrams,
      description: nutrition.description ?? null,
      priceFormatted: nutrition.priceFormatted ?? null,
      categoryColorHex: nutrition.categoryColorHex ?? null,
      businessName: nutrition.businessName ?? null,
      businessAddress: nutrition.businessAddress ?? null,
      logoDataUrl: logo,
      showStars: nutrition.showStars ?? settings.showStars,
      innerBorder: nutrition.innerBorder ?? settings.innerBorder,
    };

    for (let i = 0; i < item.quantity; i++) {
      instances.push(content);
    }
  }

  const pdf = await renderLabelSheetPdf({
    instances,
    spec,
    startAtPosition: run.startAtPosition,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="labels-run-${run.id}.pdf"`,
    },
  });
}
