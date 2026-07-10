// Creates "Pots Blank" — the pot product range at quantity zero, on the pot
// label set-up with eatlunch pots branding, as a fill-in template in the
// dashboard's "Blank print runs". Range, branding, sheet and price overrides
// (Topping Pots print no price) are taken from the existing "3 Pots SO" list.
// Idempotent (replaced by name). Run with: npm run db:create-pots-blank
import { eq } from "drizzle-orm";
import { db } from "./index";
import { standingOrders, standingOrderItems } from "./schema";

async function main() {
  const source = await db.query.standingOrders.findFirst({
    where: eq(standingOrders.name, "3 Pots SO"),
    with: { items: true },
  });
  if (!source) throw new Error('Source list "3 Pots SO" not found');

  const name = "Pots Blank";
  const existing = await db.query.standingOrders.findFirst({
    where: eq(standingOrders.name, name),
  });
  if (existing) await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));

  await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(standingOrders)
      .values({
        name,
        brandTemplateId: source.brandTemplateId, // eatlunch pots
        labelSizeId: source.labelSizeId, // pot sheet
      })
      .returning({ id: standingOrders.id });
    for (const item of source.items) {
      await tx.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId: item.productId,
        quantity: 0, // blank template
        pricePenceOverride: item.pricePenceOverride, // keep price-less Topping Pots
      });
    }
  });

  console.log(`Created "${name}": ${source.items.length} pot products, all at qty 0.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
