// Imports the print lists added 09/07 (batch 2): two more Titan/eatlunch days
// ("2d ii Weds SO TITAN", "2e i THURS SO TITAN") and four days for a new
// customer, Falko ("9a-9d Falko MON/TUES/WEDS/THURS"). Falko prints no prices
// and has no logo yet (category-coloured borders + business footer). All are
// Title|Quantity|Price report tables. Idempotent. Run: npm run db:import-latest-lists-2
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

// Report tables use shorthand / differently-cased names — link to the catalogue.
const NAME_LINKS: Record<string, string> = {
  "Cheese layered Pasta Salad": "Cheese Layered Pasta Salad",
  "Chicken Salad on Malted Bread": "Chicken Salad on Malted Bloomer",
  "Chili Pot with White Bap and Butter Portion": "Chilli Pot with White Bap and Butter",
  "Potato and Leek Soup and White Bap and Butter portion":
    "Potato and Leek Soup with White Bap and Butter",
  "Carrot and Coriander Soup with White Bap and Butter Portion":
    "Carrot and Coriander Soup with White Bap and Butter",
  "Vegan Cheese and Avocado Smash | NEW": "Vegan Cheese and Avocado Smash",
  "Tuna with Vegan Mayo": "Tuna with Vegan Mayo (No Butter)",
  "Cheese & Tomato Croissant": "Emmental Cheese & Tomato Croissant",
  "Coronation chicken on White": "Coronation Chicken with leaf on white",
  "Bacon, Brie & Cranberry Panini": "Brie, Bacon and Cranberry Panini",
  "BBQ Chicken & Leaf on White bread": "BBQ Chicken & Leaf",
};

async function main() {
  const wrapSize = await db.query.labelSizes.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.template, "wrap"),
  });
  if (!wrapSize) throw new Error("No wrap label size");
  const wrapSizeId = wrapSize.id;

  const eatlunch = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.name, "eatlunch"),
  });
  if (!eatlunch) throw new Error("eatlunch brand missing");

  // Falko uses the standard eatlunch branding template; their labels just omit
  // prices (handled per-item below), so no separate Falko brand is needed.
  const falko = eatlunch;

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
    opts: { hidePrices?: boolean } = {}
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
        quantity: row.qty,
        pricePenceOverride: opts.hidePrices
          ? 0 // 0 = print no price on this customer's labels
          : listPence != null && listPence !== product.pricePence
            ? listPence
            : null,
      });
    }
    const total = rows.reduce((a, b) => a + b.qty, 0);
    console.log(`Standing order "${orderName}": ${rows.length} lines, ${total} labels.`);
  }

  await replaceOrder("2d ii Weds SO TITAN", eatlunch.id, load("titan-weds"));
  await replaceOrder("2e i THURS SO TITAN", eatlunch.id, load("titan-thurs"));
  await replaceOrder("9a Falko MON", falko.id, load("falko-mon"), { hidePrices: true });
  await replaceOrder("9b Falko TUES", falko.id, load("falko-tues"), { hidePrices: true });
  await replaceOrder("9c Falko WEDS", falko.id, load("falko-weds"), { hidePrices: true });
  await replaceOrder("9d Falko THURS", falko.id, load("falko-thurs"), { hidePrices: true });

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
