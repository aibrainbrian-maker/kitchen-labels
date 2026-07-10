// One-off: mark every catalogue-imported product's recipe weights as
// placeholders (they encode ingredient order, not real quantities). Products
// the user created by hand are untouched. Idempotent.
// Run with: npx tsx src/db/flag-imported-placeholders.ts
import { inArray } from "drizzle-orm";
import { db } from "./index";
import { products } from "./schema";
import { CATALOGUE } from "./import-eatpure-products";
import { CATALOGUE_V2 } from "./import-v2-products";

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const slugs = [
    ...new Set(
      [...CATALOGUE, ...CATALOGUE_V2].map((item) => slugify(item.name))
    ),
  ];
  const updated = await db
    .update(products)
    .set({ placeholderWeights: true })
    .where(inArray(products.slug, slugs))
    .returning({ slug: products.slug });
  console.log(`Flagged ${updated.length} imported products (of ${slugs.length} catalogue slugs).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
