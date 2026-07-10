/* eslint-disable @next/next/no-img-element */
import type { LabelContent } from "@/lib/labels/label-content";
import {
  potNameSizePt,
  potDescSizePt,
  potIngredientsSizePt,
  wrapDescSizePt,
  POT_CONTENT_W_PT,
} from "@/lib/labels/pot-fit";

/**
 * Renders one label at true physical proportions. `scale` is screen px per mm
 * (print-out is handled by the PDF generator, which uses the same LabelContent
 * and the same mm values — keep the two in sync).
 *
 * Font sizes are expressed in mm. UK/EU legibility rules require an x-height
 * of at least 1.2mm for mandatory information; for typical fonts x-height is
 * about half the font size, so 2.4mm is the floor for body text here.
 */
const MIN_BODY_FONT_MM = 2.4;
const DEFAULT_BORDER = "#555555";

function SimplePreview({
  content,
  widthMm,
  heightMm,
  scale,
}: {
  content: LabelContent;
  widthMm: number;
  heightMm: number;
  scale: number;
}) {
  const mm = (v: number) => v * scale;
  const bodyFontMm = Math.max(MIN_BODY_FONT_MM, Math.min(3, heightMm / 16));
  const nameFontMm = Math.max(bodyFontMm + 0.8, Math.min(4.5, heightMm / 10));
  const showNutrition = heightMm >= 45;

  return (
    <div
      className="overflow-hidden border border-neutral-300 bg-white text-black shadow-sm"
      style={{
        width: mm(widthMm),
        height: mm(heightMm),
        padding: mm(1.5),
        display: "flex",
        flexDirection: "column",
        gap: mm(0.8),
        lineHeight: 1.25,
      }}
    >
      <div style={{ fontSize: mm(nameFontMm), fontWeight: 700 }}>
        {content.productName}
      </div>

      <div style={{ fontSize: mm(bodyFontMm), flex: 1, overflow: "hidden" }}>
        <span style={{ fontWeight: 700 }}>Ingredients: </span>
        {content.ingredients.map((ing, i) => (
          <span key={`${ing.name}-${i}`}>
            {i > 0 && ", "}
            {ing.isAllergen ? (
              <strong style={{ fontWeight: 800 }}>{ing.name}</strong>
            ) : (
              ing.name
            )}
          </span>
        ))}
        {content.ingredients.length === 0 && <em>No recipe defined yet</em>}
      </div>

      {showNutrition && (
        <div style={{ fontSize: mm(bodyFontMm * 0.85), color: "#333" }}>
          Nutrition per 100g: {content.nutritionPer100g.energyKj.toFixed(0)}kJ /{" "}
          {content.nutritionPer100g.energyKcal.toFixed(0)}kcal, fat{" "}
          {content.nutritionPer100g.fatG.toFixed(1)}g (sat{" "}
          {content.nutritionPer100g.saturatesG.toFixed(1)}g), carbs{" "}
          {content.nutritionPer100g.carbohydrateG.toFixed(1)}g (sugars{" "}
          {content.nutritionPer100g.sugarsG.toFixed(1)}g), protein{" "}
          {content.nutritionPer100g.proteinG.toFixed(1)}g, salt{" "}
          {content.nutritionPer100g.saltG.toFixed(2)}g
        </div>
      )}

      <div style={{ fontSize: mm(bodyFontMm) }}>
        <span style={{ fontWeight: 700 }}>
          {content.dateLabel}: {content.dateValue}
        </span>
        {content.storageInstructions && (
          <span> · {content.storageInstructions}</span>
        )}
      </div>
    </div>
  );
}

/** Keep in sync with nameFontPt in pdf-generator.tsx. */
function nameFontPt(name: string): number {
  if (name.length <= 14) return 20;
  if (name.length <= 44) return 14.6;
  return 12;
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function StarsRow({ color, px }: { color: string; px: (v: number) => number }) {
  const star = px(6.4);
  const gap = px(1.6);
  const w = star * 5 + gap * 4;
  return (
    <svg width={w} height={star} viewBox={`0 0 ${w} ${star}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon
          key={i}
          points={starPoints(i * (star + gap) + star / 2, star / 2, star / 2, star / 5)}
          fill={color}
        />
      ))}
    </svg>
  );
}

function WrapPreview({
  content,
  widthMm,
  heightMm,
  scale,
}: {
  content: LabelContent;
  widthMm: number;
  heightMm: number;
  scale: number;
}) {
  const mm = (v: number) => v * scale;
  // Wrap-label font sizes are in points, matching the supplier's PDFs.
  const pt = (v: number) => mm(v / 2.83465);
  const border = content.categoryColorHex || DEFAULT_BORDER;
  const packG = Math.round(content.totalWeightGrams);
  const per = (v: number) => (v * packG) / 100;

  const rows: Array<[string, string, string]> = [
    ["Energy (kJ)", `${content.nutritionPer100g.energyKj.toFixed(0)}kJ`, `${per(content.nutritionPer100g.energyKj).toFixed(0)}kJ`],
    ["Energy (kcal)", `${content.nutritionPer100g.energyKcal.toFixed(0)}kcal`, `${per(content.nutritionPer100g.energyKcal).toFixed(0)}kcal`],
    ["Fat", `${content.nutritionPer100g.fatG.toFixed(1)}g`, `${per(content.nutritionPer100g.fatG).toFixed(1)}g`],
    ["of which saturates", `${content.nutritionPer100g.saturatesG.toFixed(1)}g`, `${per(content.nutritionPer100g.saturatesG).toFixed(1)}g`],
    ["Carbohydrate", `${content.nutritionPer100g.carbohydrateG.toFixed(1)}g`, `${per(content.nutritionPer100g.carbohydrateG).toFixed(1)}g`],
    ["of which sugars", `${content.nutritionPer100g.sugarsG.toFixed(1)}g`, `${per(content.nutritionPer100g.sugarsG).toFixed(1)}g`],
    ["Fibre", `${content.nutritionPer100g.fibreG.toFixed(1)}g`, `${per(content.nutritionPer100g.fibreG).toFixed(1)}g`],
    ["Protein", `${content.nutritionPer100g.proteinG.toFixed(1)}g`, `${per(content.nutritionPer100g.proteinG).toFixed(1)}g`],
    ["Salt", `${content.nutritionPer100g.saltG.toFixed(2)}g`, `${per(content.nutritionPer100g.saltG).toFixed(2)}g`],
  ];

  const cellStyle: React.CSSProperties = {
    border: "0.5px solid #000",
    padding: `${pt(0.7)}px ${pt(2)}px`,
    fontSize: pt(4.5),
  };

  return (
    <div
      className="overflow-hidden bg-white text-black shadow-sm"
      style={{
        width: mm(widthMm),
        height: mm(heightMm),
        border: `${mm(2.4)}px solid ${border}`,
        borderRadius: mm(2),
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.2,
      }}
    >
      <div
        style={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          margin: mm(0.9),
          padding: mm(1.1),
          ...(content.innerBorder
            ? {
                border: `${Math.max(1, pt(0.75))}px solid ${border}`,
                borderRadius: mm(0.8),
              }
            : {}),
        }}
      >
        {/* Upside-down half: reads correctly when folded over the pack top.
            Fold-side content first — rotated 180°, the LAST child shows at
            the label's visual top edge (footer, nutrition, ingredients). */}
        <div style={{ transform: "rotate(180deg)" }}>
          <div
            style={{
              fontSize: pt(6),
              lineHeight: 1.18,
              marginTop: mm(1.4),
              textAlign: "center",
            }}
          >
            <strong>Ingredients: </strong>
            {content.ingredients.map((ing, i) => (
              <span key={`${ing.name}-${i}`}>
                {i > 0 && ", "}
                {ing.isAllergen ? <strong>{ing.name}</strong> : ing.name}
              </span>
            ))}
            {content.ingredients.length === 0 && <em>No recipe defined yet</em>}
          </div>

          {(content.nutritionPer100g.energyKcal > 0 ||
            content.nutritionPer100g.energyKj > 0) && (
            <table
              style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={packG > 0 ? 3 : 2}
                    style={{
                      ...cellStyle,
                      fontSize: pt(6.5),
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Nutrition Information
                  </th>
                </tr>
                <tr>
                  <th
                    style={{ ...cellStyle, fontSize: pt(5), textAlign: "left", width: "42%" }}
                  >
                    Average Values
                  </th>
                  <th style={{ ...cellStyle, fontSize: pt(5), textAlign: "right" }}>
                    Per 100g
                  </th>
                  {packG > 0 && (
                    <th style={{ ...cellStyle, fontSize: pt(5), textAlign: "right" }}>
                      Per Pack{" "}
                      <span style={{ fontSize: pt(4.3) }}>({packG}g)</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, per100, perPack]) => (
                  <tr key={label}>
                    <td style={{ ...cellStyle, fontWeight: 700 }}>{label}</td>
                    <td style={{ ...cellStyle, textAlign: "right" }}>{per100}</td>
                    {packG > 0 && (
                      <td style={{ ...cellStyle, textAlign: "right" }}>{perPack}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(content.businessName || content.businessAddress) && (
            <div
              style={{
                fontSize: pt(6.6),
                textAlign: "center",
                marginBottom: mm(1.4),
                lineHeight: 1.25,
              }}
            >
              {content.businessName && <div>{content.businessName}</div>}
              {content.businessAddress && <div>{content.businessAddress}</div>}
            </div>
          )}
        </div>

        {/* Upright half */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {content.showStars && <StarsRow color={border} px={mm} />}
          {content.logoDataUrl && (
            <img
              src={content.logoDataUrl}
              alt="Logo"
              style={{
                maxHeight: mm(12),
                maxWidth: mm(26),
                objectFit: "contain",
                marginTop: mm(1),
              }}
            />
          )}
          <div
            style={{
              fontSize: pt(nameFontPt(content.productName)),
              fontFamily: "'Special Elite', 'Courier New', monospace",
              textAlign: "center",
              lineHeight: 1.05,
              marginTop: mm(2),
              marginBottom: mm(1.6),
            }}
          >
            {content.productName}
          </div>
          {content.description && (
            <div
              style={{
                fontSize: pt(wrapDescSizePt(content.description)),
                fontFamily: "'Yrsa', Georgia, serif",
                textAlign: "center",
                lineHeight: 1.1,
                marginBottom: mm(1.6),
                padding: `0 ${mm(1)}px`,
              }}
            >
              {content.description}
            </div>
          )}
          {content.storageInstructions && (
            <div
              style={{ fontSize: pt(6.6), textAlign: "center", marginBottom: mm(2) }}
            >
              {content.storageInstructions}
            </div>
          )}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              padding: `0 ${mm(1.5)}px ${mm(0.6)}px`,
            }}
          >
            <div>
              <div style={{ fontSize: pt(5), marginBottom: 2 }}>
                {content.dateLabel}:
              </div>
              <div style={{ fontSize: pt(7.8), marginLeft: mm(3) }}>
                {content.dateValue}
              </div>
            </div>
            {content.priceFormatted && (
              <div style={{ fontSize: pt(13) }}>{content.priceFormatted}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Deli-pot label mirror of PotLabel in pdf-generator.tsx: plain tall strip,
 * rotated ingredients/address top, auto-sized text.
 */
function PotPreview({
  content,
  widthMm,
  heightMm,
  scale,
}: {
  content: LabelContent;
  widthMm: number;
  heightMm: number;
  scale: number;
}) {
  const mm = (v: number) => v * scale;
  const pt = (v: number) => mm(v / 2.83465);
  const nameSize = potNameSizePt(content.productName);
  const descSize = content.description ? potDescSizePt(content.description) : 0;
  const ingSize = potIngredientsSizePt([
    { text: "Ingredients: ", bold: true },
    ...content.ingredients.map((ing) => ({ text: ing.name, bold: ing.isAllergen })),
  ]);
  const addressLines = [
    ...(content.businessName ? content.businessName.split(", ") : []),
    ...(content.businessAddress ? content.businessAddress.split(", ") : []),
  ];
  const colW = pt(POT_CONTENT_W_PT);

  return (
    <div
      className="overflow-hidden border border-neutral-300 bg-white text-black shadow-sm"
      style={{
        width: mm(widthMm),
        height: mm(heightMm),
        padding: `${mm(3)}px 0`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: colW,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Fold-side content first — rotated 180°, the LAST child shows at
            the label's visual top edge (address, storage, ingredients). */}
        <div
          style={{
            transform: "rotate(180deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: colW,
              fontSize: pt(ingSize),
              lineHeight: 1.15,
              textAlign: "center",
              marginBottom: mm(2.4),
            }}
          >
            {"Ingredients: "}
            {content.ingredients.map((ing, i) => (
              <span key={`${ing.name}-${i}`}>
                {i > 0 && ", "}
                {ing.isAllergen ? <strong>{ing.name}</strong> : ing.name}
              </span>
            ))}
            {content.ingredients.length === 0 && <em>No recipe defined yet</em>}
          </div>
          {content.storageInstructions && (
            <div style={{ fontSize: pt(5.8), marginBottom: mm(2) }}>
              {content.storageInstructions}
            </div>
          )}
          {addressLines.length > 0 && (
            <div
              style={{
                fontSize: pt(4.2),
                textAlign: "center",
                lineHeight: 1.25,
              }}
            >
              {addressLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {content.logoDataUrl && (
            <img
              src={content.logoDataUrl}
              alt="Logo"
              style={{
                maxHeight: mm(10.5),
                maxWidth: mm(16),
                objectFit: "contain",
                marginBottom: mm(1),
              }}
            />
          )}
          <div
            style={{
              fontSize: pt(nameSize),
              textAlign: "center",
              lineHeight: 1.05,
              marginBottom: mm(1),
            }}
          >
            {content.productName}
          </div>
          {content.description && (
            <div
              style={{
                fontSize: pt(descSize),
                textAlign: "center",
                lineHeight: 1.15,
                marginBottom: mm(2),
              }}
            >
              {content.description}
            </div>
          )}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            <div>
              <div style={{ fontSize: pt(5.8), marginBottom: 1.5 }}>
                {content.dateLabel}:
              </div>
              <div style={{ fontSize: pt(7.7) }}>{content.dateValue}</div>
            </div>
            {content.priceFormatted && (
              <div style={{ fontSize: pt(13.6) }}>{content.priceFormatted}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LabelPreview({
  content,
  widthMm,
  heightMm,
  scale = 4,
  template = "simple",
}: {
  content: LabelContent;
  widthMm: number;
  heightMm: number;
  scale?: number;
  template?: "simple" | "wrap" | "pot";
}) {
  if (template === "wrap") {
    return (
      <WrapPreview
        content={content}
        widthMm={widthMm}
        heightMm={heightMm}
        scale={scale}
      />
    );
  }
  if (template === "pot") {
    return (
      <PotPreview
        content={content}
        widthMm={widthMm}
        heightMm={heightMm}
        scale={scale}
      />
    );
  }
  return (
    <SimplePreview
      content={content}
      widthMm={widthMm}
      heightMm={heightMm}
      scale={scale}
    />
  );
}
