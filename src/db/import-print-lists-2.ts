// Imports the four weekday J&O print lists (Tue/Weds/Thur/Fri, added to the
// Print Lists folder after the Monday lists) as standing orders, creates the
// one product that wasn't in the catalogue yet (GLUTEN FREE - Chicken Salad),
// and fills price/pack weight for products these lists cover that had none.
// Idempotent. Run with: npm run db:import-print-lists-2
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  products,
  productIngredients,
  ingredients,
  standingOrders,
  standingOrderItems,
} from "./schema";

type Item = {
  name: string;
  qty: number;
  price: string | null;
  packG: number | null;
};

const dataDir = join(process.cwd(), "src", "db", "data");
const lists: Array<{ orderName: string; items: Item[] }> = [
  { orderName: "1 cii J&O Tue SO NEW", items: load("printlist-jo-tue.json") },
  { orderName: "1 dii J&O Weds SO NEW", items: load("printlist-jo-weds.json") },
  { orderName: "1 eii J&O Thur SO NEW", items: load("printlist-jo-thur.json") },
  { orderName: "1 fii J&O Fri SO NEW", items: load("printlist-jo-fri.json") },
];

function load(file: string): Item[] {
  return JSON.parse(readFileSync(join(dataDir, file), "utf8"));
}

const pence = (price: string | null): number | null => {
  if (!price) return null;
  const m = price.match(/(\d+)\.(\d{2})/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
};

/** From the label on page 10 of "1 dii J&O Weds SO NEW.pdf". */
const GF_CHICKEN_SALAD = {
  name: "GLUTEN FREE - Chicken Salad",
  description: "Chicken Salad with Mayo Sandwich on Gluten Free",
  pricePence: 440,
  packWeightGrams: 190,
  category: "Sandwiches",
  labelCategoryName: "Chicken",
  components: [
    "Gluten Free White Bread",
    "Chicken Breast",
    "Tomatoes",
    "Mixed Salad Leaf",
    "Cucumber",
    "Mayonnaise",
    "Sunflower Spread",
  ],
  nutritionOverride: {
    energyKcal: 184, energyKj: 771, fatG: 7.6, saturatesG: 0.9,
    carbohydrateG: 18, sugarsG: 1.1, fibreG: 3.8, proteinG: 9.2, saltG: 0.73,
  },
};

async function main() {
  // 1. Create the missing product (skip if a previous run already made it)
  let gf = await db.query.products.findFirst({
    where: eq(products.name, GF_CHICKEN_SALAD.name),
  });
  if (!gf) {
    const category = await db.query.labelCategories.findFirst({
      where: (t, { eq: eqOp }) => eqOp(t.name, GF_CHICKEN_SALAD.labelCategoryName),
    });
    const [created] = await db
      .insert(products)
      .values({
        name: GF_CHICKEN_SALAD.name,
        slug: "gluten-free-chicken-salad",
        category: GF_CHICKEN_SALAD.category,
        description: GF_CHICKEN_SALAD.description,
        pricePence: GF_CHICKEN_SALAD.pricePence,
        labelCategoryId: category?.id ?? null,
        shelfLifeValue: 2,
        shelfLifeUnit: "days",
        shelfLifeType: "use_by",
        storageInstructions: "Keep Refrigerated 5°c",
        nutritionOverride: GF_CHICKEN_SALAD.nutritionOverride,
        packWeightGrams: GF_CHICKEN_SALAD.packWeightGrams,
        placeholderWeights: true,
      })
      .returning();
    let weight = 100;
    for (const componentName of GF_CHICKEN_SALAD.components) {
      const ing = await db.query.ingredients.findFirst({
        where: eq(ingredients.name, componentName),
      });
      if (!ing) throw new Error(`Unknown component "${componentName}"`);
      await db.insert(productIngredients).values({
        productId: created.id,
        ingredientId: ing.id,
        weightGrams: weight,
      });
      weight = Math.max(weight - 5, 5);
    }
    gf = created;
    console.log(`Created product "${GF_CHICKEN_SALAD.name}" (#${created.id}).`);
  }

  // 2. Standing orders (replace by name), with per-customer price overrides
  // where the label price differs from the catalogue price. Products that
  // have no catalogue price/pack weight yet take them from these labels.
  const jando = await db.query.brandTemplates.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.name, "J&O"),
  });
  const wrapSize = await db.query.labelSizes.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.template, "wrap"),
  });
  if (!jando || !wrapSize) throw new Error("J&O template or wrap size missing");

  for (const list of lists) {
    const existing = await db.query.standingOrders.findFirst({
      where: eq(standingOrders.name, list.orderName),
    });
    if (existing) {
      await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));
    }
    const [order] = await db
      .insert(standingOrders)
      .values({
        name: list.orderName,
        brandTemplateId: jando.id,
        labelSizeId: wrapSize.id,
      })
      .returning({ id: standingOrders.id });

    for (const item of lists.find((l) => l === list)!.items) {
      const product = await db.query.products.findFirst({
        where: eq(products.name, item.name),
      });
      if (!product) throw new Error(`Product not in DB: "${item.name}"`);

      const itemPence = pence(item.price);
      // Fill gaps in the catalogue from the printed label (never overwrite)
      if (
        (product.pricePence == null && itemPence != null) ||
        (product.packWeightGrams == null && item.packG != null && item.packG > 10)
      ) {
        await db
          .update(products)
          .set({
            pricePence: product.pricePence ?? itemPence,
            packWeightGrams:
              product.packWeightGrams ??
              (item.packG != null && item.packG > 10 ? item.packG : null),
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
        if (product.pricePence == null) product.pricePence = itemPence;
      }

      await db.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId: product.id,
        quantity: item.qty,
        pricePenceOverride:
          itemPence != null && itemPence !== product.pricePence
            ? itemPence
            : null,
      });
    }
    const labelCount = list.items.reduce((s, i) => s + i.qty, 0);
    console.log(`Standing order "${list.orderName}": ${list.items.length} lines, ${labelCount} labels.`);
  }

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
