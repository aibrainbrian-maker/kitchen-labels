// Imports the print lists added 09/07: "1b J&O Blank" (J&O's full range as a
// blank template — every quantity zero), "2b ii VV_BTC DAILY" and
// "2c i TUES SO TITAN" (Titan/eatlunch daily orders). All three are
// Title|Quantity|Price report tables. Idempotent — standing orders replaced
// by name. Run with: npm run db:import-latest-lists
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { brandTemplates, products, standingOrders, standingOrderItems } from "./schema";

const dataDir = join(process.cwd(), "src", "db", "data");
type Row = { name: string; qty: number; price: string | null };
const load = (f: string): Row[] =>
  JSON.parse(readFileSync(join(dataDir, `printlist-${f}.json`), "utf8"));

const pence = (price: string | null): number | null => {
  if (!price) return null;
  const m = price.match(/(\d+)\.(\d{2})/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
};

// Report tables use a few shorthand product names — link to the catalogue.
const NAME_LINKS: Record<string, string> = {
  "Tuna with Vegan Mayo": "Tuna with Vegan Mayo (No Butter)",
  "Cheese & Tomato Croissant": "Emmental Cheese & Tomato Croissant",
  "Coronation chicken on White": "Coronation Chicken with leaf on white",
  "Bacon, Brie & Cranberry Panini": "Brie, Bacon and Cranberry Panini",
  "BBQ Chicken & Leaf on White bread": "BBQ Chicken & Leaf",
  "* *VEGAN* * Beetroot falafel, Hummus, Spinach and Pomegranate Wrap":
    "Falafel with Red Pepper Hummus, Beetroot falafel (VEGAN)",
};

async function main() {
  const wrapSize = await db.query.labelSizes.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.template, "wrap"),
  });
  if (!wrapSize) throw new Error("No wrap label size");
  const wrapSizeId = wrapSize.id;

  const jando = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.name, "J&O"),
  });
  const eatlunch = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.name, "eatlunch"),
  });
  if (!jando || !eatlunch) throw new Error("J&O or eatlunch brand missing");

  const catalogue = new Map<string, { id: number; pricePence: number | null }>();
  async function resolve(name: string) {
    const target = NAME_LINKS[name] ?? name;
    let hit = catalogue.get(target);
    if (!hit) {
      const row = await db.query.products.findFirst({ where: eq(products.name, target) });
      if (!row) throw new Error(`Product not in DB: "${name}" (as "${target}")`);
      hit = { id: row.id, pricePence: row.pricePence };
      catalogue.set(target, hit);
    }
    return hit;
  }

  async function replaceOrder(
    orderName: string,
    brandId: number,
    rows: Row[],
    opts: { zeroQuantities?: boolean } = {}
  ) {
    const existing = await db.query.standingOrders.findFirst({
      where: eq(standingOrders.name, orderName),
    });
    if (existing) await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));
    const [order] = await db
      .insert(standingOrders)
      .values({ name: orderName, brandTemplateId: brandId, labelSizeId: wrapSizeId })
      .returning({ id: standingOrders.id });
    for (const row of rows) {
      const product = await resolve(row.name);
      const listPence = pence(row.price);
      await db.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId: product.id,
        quantity: opts.zeroQuantities ? 0 : row.qty,
        // Customer price shown on labels when it differs from the catalogue
        pricePenceOverride:
          listPence != null && listPence !== product.pricePence ? listPence : null,
      });
    }
    const total = opts.zeroQuantities ? 0 : rows.reduce((a, b) => a + b.qty, 0);
    console.log(`Standing order "${orderName}": ${rows.length} lines, ${total} labels.`);
  }

  // "Blank" template: the whole J&O range, every quantity forced to zero.
  await replaceOrder("1b J&O Blank", jando.id, load("jo-blank"), { zeroQuantities: true });
  await replaceOrder("2b ii VV_BTC DAILY", eatlunch.id, load("vv-btc-daily"));
  await replaceOrder("2c i TUES SO TITAN", eatlunch.id, load("tues-titan"));

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
