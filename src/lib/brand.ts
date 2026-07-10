import { db } from "@/db";

export type BrandContext = {
  id: number | null;
  businessName: string | null;
  businessAddress: string | null;
  logoDataUrl: string | null;
  tintLogo: boolean;
  showStars: boolean;
  innerBorder: boolean;
  borderColorHex: string | null;
};

const EMPTY: BrandContext = {
  id: null,
  businessName: null,
  businessAddress: null,
  logoDataUrl: null,
  tintLogo: false,
  showStars: false,
  innerBorder: false,
  borderColorHex: null,
};

/**
 * Resolves the branding (logo + business footer) for a label run. Pass a
 * brand template id to use a specific customer's branding; otherwise the
 * default template is used.
 */
export async function getBrandContext(brandTemplateId?: number | null): Promise<BrandContext> {
  if (brandTemplateId != null) {
    const row = await db.query.brandTemplates.findFirst({
      where: (t, { eq }) => eq(t.id, brandTemplateId),
    });
    if (row) return row;
  }
  const fallback = await db.query.brandTemplates.findFirst({
    where: (t, { eq }) => eq(t.isDefault, true),
  });
  if (fallback) return fallback;
  const any = await db.query.brandTemplates.findFirst({
    orderBy: (t, { asc }) => asc(t.id),
  });
  return any ?? EMPTY;
}
