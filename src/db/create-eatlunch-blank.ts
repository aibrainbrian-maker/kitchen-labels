// Creates "eatlunch Blank" — the standard sandwich menu at quantity zero,
// branded eatlunch with standard catalogue prices, so it shows in the
// dashboard's "Blank print runs" as a fill-in template. The product range is
// taken from the existing "1b J&O Blank" list (the curated menu range).
// Idempotent (replaced by name). Run with: npm run db:create-eatlunch-blank
import { eq } from "drizzle-orm";
import { db } from "./index";
import { brandTemplates, standingOrders, standingOrderItems } from "./schema";

async function main() {
  const eatlunch = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.name, "eatlunch"),
  });
  const wrapSize = await db.query.labelSizes.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.template, "wrap"),
  });
  if (!eatlunch || !wrapSize) throw new Error("eatlunch brand or wrap size missing");

  // Use the menu range already curated in the J&O blank list.
  const source = await db.query.standingOrders.findFirst({
    where: eq(standingOrders.name, "1b J&O Blank"),
    with: { items: true },
  });
  if (!source) throw new Error('Source list "1b J&O Blank" not found');

  const name = "eatlunch Blank";
  const existing = await db.query.standingOrders.findFirst({
    where: eq(standingOrders.name, name),
  });
  if (existing) await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(standingOrders)
      .values({ name, brandTemplateId: eatlunch.id, labelSizeId: wrapSize.id })
      .returning({ id: standingOrders.id });
    for (const item of source.items) {
      await tx.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId: item.productId,
        quantity: 0, // blank template — fill in on the print screen
        pricePenceOverride: null, // standard eatlunch catalogue prices
      });
    }
  });

  console.log(`Created "${name}": ${source.items.length} products, all at qty 0 (eatlunch branding).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
