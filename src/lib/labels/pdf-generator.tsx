import React from "react";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Svg,
  Polygon,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { LabelContent } from "./label-content";
import { FONT_DATA_BASE64 } from "./font-data";
import {
  potNameSizePt,
  potDescSizePt,
  potIngredientsSizePt,
  wrapDescSizePt,
  POT_CONTENT_W_PT,
} from "./pot-fit";

const MM_TO_PT = 2.83465;
const mm = (v: number) => v * MM_TO_PT;

// Fonts used by the supplier's labels: Special Elite for product names, Yrsa
// for descriptions. They're embedded as base64 (font-data.ts) and written to a
// temp file so the serverless PDF function always finds them — reading them
// from public/ fails on Vercel, whose function filesystem has no static files.
function registerEmbeddedFont(family: string, file: string) {
  const dest = path.join(os.tmpdir(), file);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, Buffer.from(FONT_DATA_BASE64[file], "base64"));
  }
  Font.register({ family, src: dest });
}
registerEmbeddedFont("Special Elite", "SpecialElite-Regular.ttf");
registerEmbeddedFont("Yrsa", "Yrsa-Regular.ttf");
// Product names never hyphenate on the supplier labels — wrap whole words.
Font.registerHyphenationCallback((word) => [word]);

// Must stay in sync with LabelPreview.tsx so screen preview and print match.
const MIN_BODY_FONT_MM = 2.4;

export type SheetGridSpec = {
  sheetWidthMm: number;
  sheetHeightMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  cols: number;
  rows: number;
  marginTopMm: number;
  marginLeftMm: number;
  gapXMm: number;
  gapYMm: number;
  template: "simple" | "wrap" | "pot";
};

export type LabelInstance = LabelContent;

function labelFontsMm(heightMm: number) {
  const body = Math.max(MIN_BODY_FONT_MM, Math.min(3, heightMm / 16));
  const name = Math.max(body + 0.8, Math.min(4.5, heightMm / 10));
  return { body, name };
}

/** Compact label for small Avery grids: name, ingredients, date. */
function SimpleLabel({
  content,
  spec,
}: {
  content: LabelContent;
  spec: SheetGridSpec;
}) {
  const { body, name } = labelFontsMm(spec.labelHeightMm);
  const showNutrition = spec.labelHeightMm >= 45;

  const styles = StyleSheet.create({
    label: {
      width: mm(spec.labelWidthMm),
      height: mm(spec.labelHeightMm),
      padding: mm(1.5),
      display: "flex",
      flexDirection: "column",
      gap: mm(0.6),
      overflow: "hidden",
    },
    name: { fontSize: mm(name), fontFamily: "Helvetica-Bold" },
    body: { fontSize: mm(body), lineHeight: 1.25, flexGrow: 1 },
    bold: { fontFamily: "Helvetica-Bold" },
    nutrition: { fontSize: mm(body * 0.85), color: "#333333" },
    dates: { fontSize: mm(body) },
  });

  return (
    <View style={styles.label}>
      <Text style={styles.name}>{content.productName}</Text>
      <Text style={styles.body}>
        <Text style={styles.bold}>Ingredients: </Text>
        {content.ingredients.map((ing, i) => (
          <React.Fragment key={`${ing.name}-${i}`}>
            {i > 0 ? ", " : ""}
            {ing.isAllergen ? (
              <Text style={styles.bold}>{ing.name}</Text>
            ) : (
              ing.name
            )}
          </React.Fragment>
        ))}
      </Text>
      {showNutrition && (
        <Text style={styles.nutrition}>
          Nutrition per 100g: {content.nutritionPer100g.energyKj.toFixed(0)}kJ /{" "}
          {content.nutritionPer100g.energyKcal.toFixed(0)}kcal, fat{" "}
          {content.nutritionPer100g.fatG.toFixed(1)}g (sat{" "}
          {content.nutritionPer100g.saturatesG.toFixed(1)}g), carbs{" "}
          {content.nutritionPer100g.carbohydrateG.toFixed(1)}g (sugars{" "}
          {content.nutritionPer100g.sugarsG.toFixed(1)}g), protein{" "}
          {content.nutritionPer100g.proteinG.toFixed(1)}g, salt{" "}
          {content.nutritionPer100g.saltG.toFixed(2)}g
        </Text>
      )}
      <Text style={styles.dates}>
        <Text style={styles.bold}>
          {content.dateLabel}: {content.dateValue}
        </Text>
        {content.storageInstructions ? ` - ${content.storageInstructions}` : ""}
      </Text>
    </View>
  );
}

const nutritionRows = (n: LabelContent["nutritionPer100g"], packG: number) => {
  const per = (v: number) => (v * packG) / 100;
  return [
    ["Energy (kJ)", `${n.energyKj.toFixed(0)}kJ`, `${per(n.energyKj).toFixed(0)}kJ`],
    ["Energy (kcal)", `${n.energyKcal.toFixed(0)}kcal`, `${per(n.energyKcal).toFixed(0)}kcal`],
    ["Fat", `${n.fatG.toFixed(1)}g`, `${per(n.fatG).toFixed(1)}g`],
    ["of which saturates", `${n.saturatesG.toFixed(1)}g`, `${per(n.saturatesG).toFixed(1)}g`],
    ["Carbohydrate", `${n.carbohydrateG.toFixed(1)}g`, `${per(n.carbohydrateG).toFixed(1)}g`],
    ["of which sugars", `${n.sugarsG.toFixed(1)}g`, `${per(n.sugarsG).toFixed(1)}g`],
    ["Fibre", `${n.fibreG.toFixed(1)}g`, `${per(n.fibreG).toFixed(1)}g`],
    ["Protein", `${n.proteinG.toFixed(1)}g`, `${per(n.proteinG).toFixed(1)}g`],
    ["Salt", `${n.saltG.toFixed(2)}g`, `${per(n.saltG).toFixed(2)}g`],
  ] as const;
};

const DEFAULT_BORDER = "#555555";

/**
 * Font size for the product name, matching the supplier's auto-fit behaviour:
 * short names print big (20pt), typical names 14.6pt over two lines, and very
 * long names step down again so they still fit.
 */
export function nameFontPt(name: string): number {
  if (name.length <= 14) return 20;
  if (name.length <= 44) return 14.6;
  return 12;
}

/** Five-pointed star, as drawn above the logo on the supplier's labels. */
function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function StarsRow({ color }: { color: string }) {
  // 5 stars, ~6.4mm wide each with ~1.6mm gaps ≈ 38mm total
  const star = mm(6.4);
  const gap = mm(1.6);
  const w = star * 5 + gap * 4;
  return (
    <Svg width={w} height={star} viewBox={`0 0 ${w} ${star}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Polygon
          key={i}
          points={starPoints(i * (star + gap) + star / 2, star / 2, star / 2, star / 5)}
          fill={color}
        />
      ))}
    </Svg>
  );
}

/**
 * Sandwich-wrap label (e.g. 6 per A4). The top section is rotated 180° so it
 * reads correctly when the label is folded over the top of a sandwich pack.
 * Border colour comes from the product's category (red meat / chicken /
 * vegetarian / seafood). Layout and font sizes replicate the supplier's
 * LabelLogic output (Special Elite name, Yrsa description, Helvetica small
 * print at 4.5–7.8pt).
 */
function WrapLabel({
  content,
  spec,
}: {
  content: LabelContent;
  spec: SheetGridSpec;
}) {
  const border = content.categoryColorHex || DEFAULT_BORDER;

  const styles = StyleSheet.create({
    label: {
      width: mm(spec.labelWidthMm),
      height: mm(spec.labelHeightMm),
      borderWidth: mm(2.4),
      borderColor: border,
      borderRadius: mm(2),
      backgroundColor: "#ffffff",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    inner: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      margin: mm(0.9),
      padding: mm(1.1),
      ...(content.innerBorder
        ? { borderWidth: 0.75, borderColor: border, borderRadius: mm(0.8) }
        : {}),
    },
    flipped: {
      transform: "rotate(180deg)",
      display: "flex",
      flexDirection: "column",
    },
    footer: {
      fontSize: 6.6,
      textAlign: "center",
      color: "#222222",
      marginBottom: mm(1.4),
      lineHeight: 1.25,
    },
    tableTitle: {
      fontSize: 6.5,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
      borderWidth: 0.5,
      borderColor: "#000000",
      borderBottomWidth: 0,
      paddingVertical: 1,
    },
    tableHeadRow: {
      flexDirection: "row",
      borderWidth: 0.5,
      borderColor: "#000000",
    },
    tableRow: {
      flexDirection: "row",
      borderWidth: 0.5,
      borderColor: "#000000",
      borderTopWidth: 0,
    },
    cellLabel: {
      flex: 1.5,
      fontSize: 4.5,
      fontFamily: "Helvetica-Bold",
      paddingHorizontal: 2,
      paddingVertical: 0.7,
    },
    cell: {
      flex: 1,
      fontSize: 4.5,
      paddingHorizontal: 2,
      paddingVertical: 0.7,
      textAlign: "right",
    },
    headCell: { fontFamily: "Helvetica-Bold", fontSize: 5 },
    packNote: { fontSize: 4.3 },
    ingredients: {
      fontSize: 6,
      lineHeight: 1.18,
      marginTop: mm(1.4),
      textAlign: "center",
    },
    bold: { fontFamily: "Helvetica-Bold" },
    upright: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    logo: {
      maxHeight: mm(12),
      maxWidth: mm(26),
      objectFit: "contain",
      marginTop: mm(1),
    },
    name: {
      fontSize: nameFontPt(content.productName),
      fontFamily: "Special Elite",
      textAlign: "center",
      lineHeight: 1.05,
      marginTop: mm(2),
      marginBottom: mm(1.6),
    },
    description: {
      fontSize: content.description ? wrapDescSizePt(content.description) : 9.7,
      fontFamily: "Yrsa",
      textAlign: "center",
      lineHeight: 1.1,
      marginBottom: mm(1.6),
      paddingHorizontal: mm(1),
    },
    storage: {
      fontSize: 6.6,
      textAlign: "center",
      marginBottom: mm(2),
    },
    bottomRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      paddingHorizontal: mm(1.5),
      paddingBottom: mm(0.6),
    },
    useByLabel: { fontSize: 5, marginBottom: 2 },
    useByDate: { fontSize: 7.8, marginLeft: mm(3) },
    price: { fontSize: 13, fontFamily: "Helvetica" },
  });

  const packG = Math.round(content.totalWeightGrams);
  // Nutrition is voluntary on PPDS labels — omit the table entirely rather
  // than print a misleading all-zero panel when no data has been entered.
  const hasNutrition =
    content.nutritionPer100g.energyKcal > 0 || content.nutritionPer100g.energyKj > 0;

  return (
    <View style={styles.label}>
      <View style={styles.inner}>
        {/* Upside-down half: reads correctly when folded over the pack top.
            Children are listed fold-side first — after the 180° rotation the
            LAST child prints at the label's physical top edge (business
            footer, then nutrition, then ingredients, like the supplier's). */}
        <View style={styles.flipped}>
          <Text style={styles.ingredients}>
            <Text style={styles.bold}>Ingredients: </Text>
            {content.ingredients.map((ing, i) => (
              <React.Fragment key={`${ing.name}-${i}`}>
                {i > 0 ? ", " : ""}
                {ing.isAllergen ? (
                  <Text style={styles.bold}>{ing.name}</Text>
                ) : (
                  ing.name
                )}
              </React.Fragment>
            ))}
          </Text>

          {hasNutrition && (
            <>
              <Text style={styles.tableTitle}>Nutrition Information</Text>
              <View style={styles.tableHeadRow}>
                <Text style={[styles.cellLabel, styles.headCell]}>
                  Average Values
                </Text>
                <Text style={[styles.cell, styles.headCell]}>Per 100g</Text>
                {packG > 0 && (
                  <Text style={[styles.cell, styles.headCell]}>
                    Per Pack{"\n"}
                    <Text style={styles.packNote}>({packG}g)</Text>
                  </Text>
                )}
              </View>
              {nutritionRows(content.nutritionPer100g, packG).map(
                ([label, per100, perPack]) => (
                  <View key={label} style={styles.tableRow}>
                    <Text style={styles.cellLabel}>{label}</Text>
                    <Text style={styles.cell}>{per100}</Text>
                    {packG > 0 && <Text style={styles.cell}>{perPack}</Text>}
                  </View>
                )
              )}
            </>
          )}

          {(content.businessName || content.businessAddress) && (
            <View style={styles.footer}>
              {content.businessName ? <Text>{content.businessName}</Text> : null}
              {content.businessAddress ? (
                <Text>{content.businessAddress}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Upright half */}
        <View style={styles.upright}>
          {content.showStars && <StarsRow color={border} />}
          {content.logoDataUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={content.logoDataUrl} style={styles.logo} />
          )}
          <Text style={styles.name}>{content.productName}</Text>
          {content.description && (
            <Text style={styles.description}>{content.description}</Text>
          )}
          {content.storageInstructions && (
            <Text style={styles.storage}>{content.storageInstructions}</Text>
          )}
          <View style={styles.bottomRow}>
            <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Text style={styles.useByLabel}>{content.dateLabel}:</Text>
              <Text style={styles.useByDate}>{content.dateValue}</Text>
            </View>
            {content.priceFormatted && (
              <Text style={styles.price}>{content.priceFormatted}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Deli-pot wrap label (8 per A4, tall narrow strip). Plain design: no colour
 * border, no nutrition table; the top half (ingredients, storage, address
 * stack) is rotated 180° to read correctly folded over the pot. Name,
 * description and ingredients auto-size to fill the space, matching the
 * supplier's LabelLogic output.
 */
function PotLabel({
  content,
  spec,
}: {
  content: LabelContent;
  spec: SheetGridSpec;
}) {
  const nameSize = potNameSizePt(content.productName);
  const descSize = content.description ? potDescSizePt(content.description) : 0;
  const ingSize = potIngredientsSizePt([
    { text: "Ingredients: ", bold: true },
    ...content.ingredients.map((ing) => ({ text: ing.name, bold: ing.isAllergen })),
  ]);
  // Address prints as a stack of short centred lines at the very top
  const addressLines = [
    ...(content.businessName ? content.businessName.split(", ") : []),
    ...(content.businessAddress ? content.businessAddress.split(", ") : []),
  ];

  const styles = StyleSheet.create({
    label: {
      width: mm(spec.labelWidthMm),
      height: mm(spec.labelHeightMm),
      backgroundColor: "#ffffff",
      paddingVertical: mm(3),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden",
    },
    column: {
      width: POT_CONTENT_W_PT,
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
    },
    flipped: {
      transform: "rotate(180deg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    },
    address: {
      fontSize: 4.2,
      textAlign: "center",
      lineHeight: 1.25,
    },
    storage: {
      fontSize: 5.8,
      textAlign: "center",
      marginBottom: mm(2),
    },
    ingredients: {
      width: POT_CONTENT_W_PT,
      fontSize: ingSize,
      lineHeight: 1.15,
      textAlign: "center",
      marginBottom: mm(2.4),
    },
    bold: { fontFamily: "Helvetica-Bold" },
    upright: {
      flexGrow: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    logo: {
      maxHeight: mm(10.5),
      maxWidth: mm(16),
      objectFit: "contain",
      marginBottom: mm(1),
    },
    name: {
      fontSize: nameSize,
      textAlign: "center",
      lineHeight: 1.05,
      marginBottom: mm(1),
    },
    description: {
      fontSize: descSize,
      textAlign: "center",
      lineHeight: 1.15,
      marginBottom: mm(2),
    },
    bottomRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    useByLabel: { fontSize: 5.8, marginBottom: 1.5 },
    useByDate: { fontSize: 7.7 },
    price: { fontSize: 13.6 },
  });

  return (
    <View style={styles.label}>
      <View style={styles.column}>
        {/* Upside-down half: reads correctly when folded over the pot lid.
            Children are listed fold-side first — after the 180° rotation the
            LAST child prints at the label's physical top edge (address, then
            storage, then ingredients, exactly like the supplier's labels). */}
        <View style={styles.flipped}>
          <Text style={styles.ingredients}>
            {"Ingredients: "}
            {content.ingredients.map((ing, i) => (
              <React.Fragment key={`${ing.name}-${i}`}>
                {i > 0 ? ", " : ""}
                {ing.isAllergen ? (
                  <Text style={styles.bold}>{ing.name}</Text>
                ) : (
                  ing.name
                )}
              </React.Fragment>
            ))}
          </Text>
          {content.storageInstructions && (
            <Text style={styles.storage}>{content.storageInstructions}</Text>
          )}
          {addressLines.length > 0 && (
            <View style={styles.address}>
              {addressLines.map((line, i) => (
                <Text key={i}>{line}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Upright half */}
        <View style={styles.upright}>
          {content.logoDataUrl && (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={content.logoDataUrl} style={styles.logo} />
          )}
          <Text style={styles.name}>{content.productName}</Text>
          {content.description && (
            <Text style={styles.description}>{content.description}</Text>
          )}
          <View style={styles.bottomRow}>
            <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <Text style={styles.useByLabel}>{content.dateLabel}:</Text>
              <Text style={styles.useByDate}>{content.dateValue}</Text>
            </View>
            {content.priceFormatted && (
              <Text style={styles.price}>{content.priceFormatted}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Lays out label instances onto sheet pages. `startAtPosition` (1-based,
 * reading order left-to-right then top-to-bottom) lets a partially-used sheet
 * be loaded and printing begin at the first unused label.
 */
export function paginate(
  totalLabels: number,
  perSheet: number,
  startAtPosition: number
): Array<Array<{ instanceIndex: number; position: number }>> {
  const pages: Array<Array<{ instanceIndex: number; position: number }>> = [];
  let position = Math.max(0, Math.min(startAtPosition - 1, perSheet - 1));
  let page: Array<{ instanceIndex: number; position: number }> = [];

  for (let i = 0; i < totalLabels; i++) {
    page.push({ instanceIndex: i, position });
    position += 1;
    if (position >= perSheet) {
      pages.push(page);
      page = [];
      position = 0;
    }
  }
  if (page.length > 0) pages.push(page);
  return pages;
}

export function LabelSheetDocument({
  instances,
  spec,
  startAtPosition = 1,
}: {
  instances: LabelInstance[];
  spec: SheetGridSpec;
  startAtPosition?: number;
}) {
  const perSheet = spec.cols * spec.rows;
  const pages = paginate(instances.length, perSheet, startAtPosition);
  const Label =
    spec.template === "wrap"
      ? WrapLabel
      : spec.template === "pot"
        ? PotLabel
        : SimpleLabel;

  return (
    <Document>
      {pages.map((page, pageIdx) => (
        <Page
          key={pageIdx}
          size={[mm(spec.sheetWidthMm), mm(spec.sheetHeightMm)]}
        >
          {page.map(({ instanceIndex, position }) => {
            const col = position % spec.cols;
            const row = Math.floor(position / spec.cols);
            const left = spec.marginLeftMm + col * (spec.labelWidthMm + spec.gapXMm);
            const top = spec.marginTopMm + row * (spec.labelHeightMm + spec.gapYMm);
            return (
              <View
                key={instanceIndex}
                style={{ position: "absolute", left: mm(left), top: mm(top) }}
              >
                <Label content={instances[instanceIndex]} spec={spec} />
              </View>
            );
          })}
        </Page>
      ))}
    </Document>
  );
}

export async function renderLabelSheetPdf(args: {
  instances: LabelInstance[];
  spec: SheetGridSpec;
  startAtPosition?: number;
}): Promise<Buffer> {
  return renderToBuffer(
    <LabelSheetDocument
      instances={args.instances}
      spec={args.spec}
      startAtPosition={args.startAtPosition}
    />
  );
}
