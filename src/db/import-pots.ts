// Imports the pot print lists ("3 Pots SO.pdf", "4 Cafe Pots Daily.pdf"):
// creates the pot label sheet (8 per A4), the "eatlunch pots" brand template
// (plain design: no colour border/stars/tint, full site address), the 11 pot
// products with recipes, and both standing orders. Idempotent.
// Run with: npm run db:import-pots
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  labelSizes,
  brandTemplates,
  ingredients,
  ingredientAllergens,
  products,
  productIngredients,
  standingOrders,
  standingOrderItems,
} from "./schema";

const logos: { eatlunch: string } = JSON.parse(
  readFileSync(join(process.cwd(), "src", "db", "data", "brand-logos.json"), "utf8")
);

type PotProduct = {
  name: string;
  description: string | null;
  pricePence: number | null;
  labelCategoryName: string;
  shelfLifeValue: number;
  components: string[];
};

// From the printed labels (both pot lists carry identical product data)
const POT_PRODUCTS: PotProduct[] = [
  {
    name: "Chicken Chunks",
    description: "Homemade Chicken Chunks in Breadcrumbs",
    pricePence: 280, labelCategoryName: "Chicken", shelfLifeValue: 2,
    components: ["Chicken Breast", "Golden Breadcrumbs", "Chicken Stock Mix", "Free Range Eggs", "Semi Skimmed Milk"],
  },
  {
    name: "Crudites & Hummus",
    description: "Carrot, Cucumber & Celery Batons",
    pricePence: 260, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Hummus", "Carrot", "Cucumber", "Celery Batons"],
  },
  {
    name: "Egg Protein Pot",
    description: null,
    pricePence: 220, labelCategoryName: "Vegetarian", shelfLifeValue: 3,
    components: ["Eggs"],
  },
  {
    name: "Fruit Salad",
    description: "Fresh Seasonal Fruit",
    pricePence: 260, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Strawberries", "Pineapple", "Grapes", "Melon"],
  },
  {
    name: "Greek Yoghurt, Granola and Honey",
    description: "Half fat Greek Yoghurt with a dash of honey and Granola to top",
    pricePence: 250, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Greek Yogurt", "Granola", "Honey"],
  },
  {
    name: "Greek Yoghurt, Lemon and Granola",
    description: "Half fat Greek Yoghurt, Lemon curd and Granola topping",
    pricePence: 250, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Greek Yogurt", "Granola", "Lemon Curd"],
  },
  {
    name: "Greek Yoghurt, Strawberry and Granola",
    description: "Half fat Greek Yoghurt, Strawberry Compote and Granola topping",
    pricePence: 250, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Strawberry Compote", "Greek Yogurt", "Granola"],
  },
  {
    name: "Plain Salad",
    description: "Lettuce, cucumber, Cherry Tomatoes and Carrot",
    pricePence: 100, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Cucumber", "Cherry Tomatoes", "Carrot", "Mixed Salad Leaf"],
  },
  {
    name: "Topping Pot - Cheese",
    description: null,
    pricePence: null, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Grated Cheddar", "Grated Mozzarella & Cheddar", "Red Leicester"],
  },
  {
    name: "Topping Pot - Coleslaw",
    description: null,
    pricePence: null, labelCategoryName: "Vegetarian", shelfLifeValue: 2,
    components: ["Coleslaw"],
  },
  {
    name: "Topping Pot - Tuna",
    description: null,
    pricePence: null, labelCategoryName: "Seafood", shelfLifeValue: 2,
    components: ["Tuna Mayonnaise"],
  },
];

const NEW_COMPONENTS: Array<{ name: string; declaration: string | null; allergens: string[] }> = [
  {
    name: "Chicken Stock Mix",
    declaration:
      "Chicken Stock Mix (Chicken Stock (Water, Chicken Stock), Flavouring, Glucose Syrup, Salt, Yeast Extracts, Sugar)",
    allergens: [],
  },
  // Plain hardboiled eggs as sold in protein pots — prints exactly "Eggs"
  { name: "Eggs", declaration: null, allergens: ["eggs"] },
];

// name -> [list qty in "3 Pots SO", qty in "4 Cafe Pots Daily"]
const ORDERS: Array<{ orderName: string; file: string }> = [
  { orderName: "3 Pots SO", file: "printlist-pots-so.json" },
  { orderName: "4 Cafe Pots Daily", file: "printlist-cafepots.json" },
];

async function main() {
  // 1. Pot label sheet: 8 per A4 (4 cols x 2 rows), full-bleed grid
  let potSize = await db.query.labelSizes.findFirst({
    where: eq(labelSizes.template, "pot"),
  });
  if (!potSize) {
    [potSize] = await db
      .insert(labelSizes)
      .values({
        name: "Pot wrap (8 per sheet)",
        kind: "sheet_grid",
        isCustom: false,
        isActive: true,
        widthMm: 52.5,
        heightMm: 148.5,
        sheetWidthMm: 210,
        sheetHeightMm: 297,
        cols: 4,
        rows: 2,
        marginTopMm: 0,
        marginLeftMm: 0,
        gapXMm: 0,
        gapYMm: 0,
        template: "pot",
      })
      .returning();
    console.log(`Created label size "Pot wrap (8 per sheet)" (#${potSize.id}).`);
  }

  // 2. Brand template for pots: eatlunch heart, plain styling, full address
  const existingBrand = await db.query.brandTemplates.findFirst({
    where: eq(brandTemplates.name, "eatlunch pots"),
  });
  const brandValues = {
    name: "eatlunch pots",
    businessName: "Eatpure Ltd",
    businessAddress: "Unit 5 Sutherland Court, Brownfields, Welwyn Garden City, Herts, AL7 1BJ",
    logoDataUrl: logos.eatlunch,
    labelSizeId: potSize.id,
    tintLogo: false,
    showStars: false,
    innerBorder: false,
  };
  let brandId: number;
  if (existingBrand) {
    await db.update(brandTemplates).set(brandValues).where(eq(brandTemplates.id, existingBrand.id));
    brandId = existingBrand.id;
  } else {
    const [row] = await db.insert(brandTemplates).values(brandValues).returning({ id: brandTemplates.id });
    brandId = row.id;
  }
  console.log(`Brand template "eatlunch pots" #${brandId}.`);

  // 3. New component ingredients
  const allergenRows = await db.query.allergens.findMany();
  const allergenBySlug = new Map(allergenRows.map((a) => [a.slug, a.id]));
  for (const comp of NEW_COMPONENTS) {
    let row = await db.query.ingredients.findFirst({
      where: eq(ingredients.name, comp.name),
    });
    if (!row) {
      [row] = await db
        .insert(ingredients)
        .values({ name: comp.name, labelDeclaration: comp.declaration })
        .returning();
      for (const slug of comp.allergens) {
        await db
          .insert(ingredientAllergens)
          .values({ ingredientId: row.id, allergenId: allergenBySlug.get(slug)! })
          .onConflictDoNothing();
      }
      console.log(`Created component "${comp.name}".`);
    }
  }

  // 4. Pot products
  const categories = await db.query.labelCategories.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  const productIdByName = new Map<string, number>();

  for (const item of POT_PRODUCTS) {
    let product = await db.query.products.findFirst({
      where: eq(products.name, item.name),
    });
    if (!product) {
      [product] = await db
        .insert(products)
        .values({
          name: item.name,
          slug: item.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          category: "Pots",
          description: item.description,
          pricePence: item.pricePence,
          labelCategoryId: categoryByName.get(item.labelCategoryName) ?? null,
          shelfLifeValue: item.shelfLifeValue,
          shelfLifeUnit: "days",
          shelfLifeType: "use_by",
          storageInstructions: "Keep Refrigerated 5°c",
          nutritionOverride: null,
          packWeightGrams: null,
          placeholderWeights: true,
        })
        .returning();
      let weight = 100;
      for (const componentName of item.components) {
        const ing = await db.query.ingredients.findFirst({
          where: eq(ingredients.name, componentName),
        });
        if (!ing) throw new Error(`Unknown component "${componentName}" for "${item.name}"`);
        await db.insert(productIngredients).values({
          productId: product.id,
          ingredientId: ing.id,
          weightGrams: weight,
        });
        weight = Math.max(weight - 5, 5);
      }
      console.log(`Created product "${item.name}" (#${product.id}).`);
    }
    productIdByName.set(item.name, product.id);
  }

  // 5. Standing orders from the parsed lists
  for (const { orderName, file } of ORDERS) {
    const items: Array<{ name: string; qty: number }> = JSON.parse(
      readFileSync(join(process.cwd(), "src", "db", "data", file), "utf8")
    );
    const existing = await db.query.standingOrders.findFirst({
      where: eq(standingOrders.name, orderName),
    });
    if (existing) await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));
    const [order] = await db
      .insert(standingOrders)
      .values({ name: orderName, brandTemplateId: brandId, labelSizeId: potSize.id })
      .returning({ id: standingOrders.id });
    for (const item of items) {
      const productId = productIdByName.get(item.name);
      if (!productId) throw new Error(`Pot product missing: "${item.name}"`);
      await db.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId,
        quantity: item.qty,
        pricePenceOverride: null,
      });
    }
    console.log(`Standing order "${orderName}": ${items.length} lines, ${items.reduce((a, b) => a + b.qty, 0)} labels.`);
  }

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
