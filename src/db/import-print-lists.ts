// Import the two customer print lists (Print Lists folder) as standing
// orders, create the eatlunch and J&O brand templates from the Images folder
// logos, and upgrade products with the pack weights/prices shown on the
// supplier's own labels. Idempotent: templates and standing orders are
// replaced by name, product updates converge. Run: npm run db:import-print-lists
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  brandTemplates,
  products,
  standingOrders,
  standingOrderItems,
} from "./schema";

type TitanItem = {
  name: string;
  desc: string;
  price: string | null;
  packG: number | null;
  qty: number;
  nutrition: Record<string, number>;
};
type JoItem = { name: string; qty: number; price: string; packG: number | null };

const dataDir = join(process.cwd(), "src", "db", "data");
const titan: TitanItem[] = JSON.parse(
  readFileSync(join(dataDir, "printlist-titan.json"), "utf8")
);
const jo: JoItem[] = JSON.parse(
  readFileSync(join(dataDir, "printlist-jo.json"), "utf8")
);
const logos: { eatlunch: string; jando: string } = JSON.parse(
  readFileSync(join(dataDir, "brand-logos.json"), "utf8")
);

/** "Â£3.80" (possibly with mangled Â£) â†’ 380 */
const pence = (price: string | null): number | null => {
  if (!price) return null;
  const m = price.match(/(\d+)\.(\d{2})/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
};

async function main() {
  const businessName = "Eatpure Ltd";
  const businessAddress = "Unit 5 Sutherland Court, Welwyn Garden City, AL7 1BJ";

  // Label set-up used by both lists: the 6-per-sheet wrap template
  const wrapSize = await db.query.labelSizes.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.template, "wrap"),
  });
  if (!wrapSize) throw new Error("No wrap label size found");
  const wrapSizeId = wrapSize.id;

  // 1. Brand templates (upsert by name)
  async function upsertTemplate(values: typeof brandTemplates.$inferInsert) {
    const existing = await db.query.brandTemplates.findFirst({
      where: eq(brandTemplates.name, values.name),
    });
    if (existing) {
      await db
        .update(brandTemplates)
        .set(values)
        .where(eq(brandTemplates.id, existing.id));
      return existing.id;
    }
    const [row] = await db
      .insert(brandTemplates)
      .values(values)
      .returning({ id: brandTemplates.id });
    return row.id;
  }

  const eatlunchId = await upsertTemplate({
    name: "eatlunch",
    businessName,
    businessAddress,
    logoDataUrl: logos.eatlunch,
    labelSizeId: wrapSizeId,
    tintLogo: true,
    showStars: true,
    innerBorder: false,
  });
  const jandoId = await upsertTemplate({
    name: "J&O",
    businessName,
    businessAddress,
    logoDataUrl: logos.jando,
    labelSizeId: wrapSizeId,
    tintLogo: false,
    showStars: true,
    innerBorder: true,
  });
  console.log(`Brand templates: eatlunch #${eatlunchId}, J&O #${jandoId}`);

  // 2. Product upgrades: pack weight + price straight from the printed labels.
  // Titan's price wins as the catalogue price when the two lists disagree;
  // the J&O standing order carries per-item overrides for its own prices.
  const productIdByName = new Map<string, number>();
  const basePriceByName = new Map<string, number | null>();
  const allNames = new Set([...titan.map((t) => t.name), ...jo.map((j) => j.name)]);

  for (const name of allNames) {
    const product = await db.query.products.findFirst({
      where: eq(products.name, name),
    });
    if (!product) throw new Error(`Product not in DB: "${name}"`);
    productIdByName.set(name, product.id);

    const t = titan.find((x) => x.name === name);
    const j = jo.find((x) => x.name === name);
    const packG = t?.packG ?? j?.packG ?? null;
    const price = pence(t?.price ?? null) ?? pence(j?.price ?? null);

    await db
      .update(products)
      .set({
        packWeightGrams: packG ?? product.packWeightGrams,
        pricePence: price ?? product.pricePence,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));
    basePriceByName.set(name, price ?? product.pricePence);
  }
  console.log(`Upgraded ${allNames.size} products with pack weight + price.`);

  // 3. Standing orders named exactly after the source PDF files.
  async function replaceOrder(
    name: string,
    brandTemplateId: number,
    items: Array<{ name: string; qty: number; price: string | null }>
  ) {
    const existing = await db.query.standingOrders.findFirst({
      where: eq(standingOrders.name, name),
    });
    if (existing) await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));

    const [order] = await db
      .insert(standingOrders)
      .values({ name, brandTemplateId, labelSizeId: wrapSizeId })
      .returning({ id: standingOrders.id });

    for (const item of items) {
      const productId = productIdByName.get(item.name)!;
      const itemPence = pence(item.price);
      const base = basePriceByName.get(item.name) ?? null;
      await db.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId,
        quantity: item.qty,
        pricePenceOverride:
          itemPence != null && itemPence !== base ? itemPence : null,
      });
    }
    console.log(`Standing order "${name}": ${items.length} lines, ${items.reduce((a, b) => a + b.qty, 0)} labels.`);
  }

  await replaceOrder(
    "1 bii J&O Mon SO NEW",
    jandoId,
    jo.map((j) => ({ name: j.name, qty: j.qty, price: j.price }))
  );
  await replaceOrder(
    "2ai Mon SO Titan Vans BTC Spring 26",
    eatlunchId,
    titan.map((t) => ({ name: t.name, qty: t.qty, price: t.price }))
  );

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
