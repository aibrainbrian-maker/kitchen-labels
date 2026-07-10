import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { loadProductWithDerived } from "@/lib/product-data";
import { buildLabelContent } from "@/lib/labels/label-content";
import { getBrandContext } from "@/lib/brand";
import { tintPngDataUrl } from "@/lib/labels/tint-logo";
import LabelPreview from "@/components/LabelPreview";

export default async function ProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  const [loaded, labelSizes, settings] = await Promise.all([
    loadProductWithDerived(productId),
    db.query.labelSizes.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => asc(t.name),
    }),
    getBrandContext(),
  ]);

  if (!loaded) notFound();
  const { product, derived, allergenNamesBySlug } = loaded;

  const categoryColorHex =
    settings.borderColorHex ?? product.labelCategory?.colorHex ?? null;
  const logo =
    settings.tintLogo && settings.logoDataUrl && categoryColorHex
      ? tintPngDataUrl(settings.logoDataUrl, categoryColorHex)
      : settings.logoDataUrl;

  const content = buildLabelContent({
    productName: product.name,
    derived,
    allergenNamesBySlug,
    shelfLifeValue: product.shelfLifeValue,
    shelfLifeUnit: product.shelfLifeUnit,
    shelfLifeType: product.shelfLifeType,
    storageInstructions: product.storageInstructions,
    prepDate: new Date(),
    description: product.description,
    pricePence: product.pricePence,
    categoryColorHex,
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    logoDataUrl: logo,
    showStars: settings.showStars,
    innerBorder: settings.innerBorder,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href={`/products/${productId}`} className="text-sm text-neutral-500 hover:underline">
        ← Back to {product.name}
      </Link>
      <h1 className="mb-2 mt-1 text-2xl font-semibold text-neutral-900">
        Label preview
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        Shown enlarged, with today as the prep date. Allergens appear bold in
        the ingredients list exactly as they will print. On wrap labels, the
        top half prints upside down on purpose — it reads correctly once the
        label is folded over the pack.
      </p>

      <div className="flex flex-wrap gap-10">
        {labelSizes.map((ls) => (
          <div key={ls.id}>
            <h2 className="mb-3 text-sm font-semibold text-neutral-700">
              {ls.name} — {ls.widthMm}×{ls.heightMm}mm
            </h2>
            <LabelPreview
              content={content}
              widthMm={ls.widthMm}
              heightMm={ls.heightMm}
              template={ls.template}
              scale={ls.template === "wrap" ? 3 : 4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
