// Imports the Surfin (7b/7c, six lists) and Herts Station (8/8a/8b/8c) print
// lists: two new brand templates, the products these customers sell that
// weren't in the catalogue yet, and ten standing orders — including
// "8 Herts Station Blank", the full product range at quantity 0, used as a
// template for building new Herts Station lists. Idempotent.
// Run with: npm run db:import-surfin-herts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  brandTemplates,
  ingredients,
  ingredientAllergens,
  products,
  productIngredients,
  standingOrders,
  standingOrderItems,
} from "./schema";

const dataDir = join(process.cwd(), "src", "db", "data");
const logos: { surfin: string; mindthegap: string } = JSON.parse(
  readFileSync(join(dataDir, "brand-logos.json"), "utf8")
);
type Item = { name: string; qty: number; price: string | null; packG?: number | null };
const load = (f: string): Item[] =>
  JSON.parse(readFileSync(join(dataDir, `printlist-${f}.json`), "utf8"));

const pence = (price: string | null | undefined): number | null => {
  if (!price) return null;
  const m = price.match(/(\d+)\.(\d{2})/);
  return m ? Number(m[1]) * 100 + Number(m[2]) : null;
};

// The Herts blank range sheet uses a few older names for products already in
// the catalogue — link rather than duplicate.
const NAME_LINKS: Record<string, string> = {
  "* *VEGAN* * Beetroot falafel, Hummus, Spinach and Pomegranate Wrap":
    "Falafel with Red Pepper Hummus, Beetroot falafel (VEGAN)",
  "BBQ Chicken & Leaf on White bread": "BBQ Chicken & Leaf",
  "Bacon, Brie & Cranberry Panini": "Brie, Bacon and Cranberry Panini",
  "Cheese & Tomato Croissant": "Emmental Cheese & Tomato Croissant",
  "Coronation chicken on White": "Coronation Chicken with leaf on white",
};

const NEW_COMPONENTS = [
  {
    name: "Shredded Duck",
    declaration: "Shredded Roast Duck (Duck, Salt)",
    allergens: [] as string[],
  },
  {
    name: "Hoisin Sauce",
    declaration:
      "Hoisin Sauce (Sugar, Water, SOYA Bean Paste (Water, SOYA Beans, Salt, WHEAT Flour), Rice Vinegar, Modified Maize Starch, Salt, SESAME Oil, Garlic Powder, Spices, Colour (Caramel))",
    allergens: ["soybeans", "cereals-containing-gluten", "sesame"],
  },
  {
    name: "Horseradish Sauce",
    declaration:
      "Horseradish Sauce (Water, Rapeseed Oil, Horseradish (18%), Sugar, Spirit Vinegar, Modified Maize Starch, Pasteurised EGG Yolk, Salt, MUSTARD Flour, Stabiliser (Xanthan Gum), Preservative (Potassium Sorbate))",
    allergens: ["eggs", "mustard"],
  },
];

type Panel = [number, number, number, number, number, number, number, number, number];
type NewProduct = {
  name: string;
  description: string | null;
  pricePence: number | null;
  labelCategoryName: string;
  packG: number | null;
  nutrition: Panel | null; // [kcal,kJ,fat,sat,carb,sug,fib,prot,salt]
  components: string[];
};

// First 8 transcribed from the Herts Station daily labels; the rest appear
// only on the blank range sheet, so they get recipes from known components
// and no nutrition panel yet (the label omits the table until data exists).
const NEW_PRODUCTS: NewProduct[] = [
  {
    name: "Cheese & Pickle, White Roll",
    description: "Sliced Cheddar in a Soft White Roll with Branston's Pickle",
    pricePence: null, labelCategoryName: "Vegetarian", packG: 123,
    nutrition: [307, 1287, 14, 7.7, 33, 2.6, 1.6, 14, 1.3],
    components: ["White Roll", "Sliced Mild Cheddar", "Branston Original Pickle", "Sunflower Spread"],
  },
  {
    name: "Cheese Roll, Soft White",
    description: "Sliced Cheddar in a Soft White Roll",
    pricePence: null, labelCategoryName: "Vegetarian", packG: 118,
    nutrition: [315, 1322, 15, 8.0, 33, 1.7, 1.7, 15, 1.3],
    components: ["White Roll", "Mature Cheddar", "Sunflower Spread"],
  },
  {
    name: "Ham Roll, Soft White",
    description: "Wafer thin ham in a soft white roll",
    pricePence: null, labelCategoryName: "Red meat", packG: 118,
    nutrition: [210, 890, 4.2, 1.0, 33, 2.0, 1.7, 12, 1.3],
    components: ["White Roll", "Wafer Thin Ham", "Sunflower Spread"],
  },
  {
    name: "Ham & Cheese, Granary Roll",
    description: "Wafer thin ham and sliced cheese in a granary roll",
    pricePence: null, labelCategoryName: "Red meat", packG: 153,
    nutrition: [254, 1068, 13, 6.7, 21, 1.6, 2.0, 16, 1.5],
    components: ["Granary Roll", "Wafer Thin Ham", "Sliced Mild Cheddar", "Sunflower Spread"],
  },
  {
    name: "Tuna Mayo & Cucumber",
    description: "Tuna Mayo and Cucumber on a soft Granary roll.",
    pricePence: null, labelCategoryName: "Seafood", packG: 143,
    nutrition: [213, 899, 8.4, 1.3, 24, 1.8, 2.4, 12, 0.89],
    components: ["Granary Roll", "Tuna", "Cucumber", "Mayonnaise", "Sunflower Spread", "Salt & Black Pepper"],
  },
  {
    name: "Chicken & Sweetcorn on White",
    description: "Chicken Breast, Sweetcorn and Mayo on White Bread",
    pricePence: null, labelCategoryName: "Chicken", packG: 170,
    nutrition: [218, 917, 8.3, 0.9, 25, 2.1, 1.7, 13, 1.2],
    components: ["White Bread", "Chicken Breast", "Mayonnaise", "Sweetcorn", "Salt & Black Pepper"],
  },
  {
    name: "Chunky Egg Mayo and Cress on Wholemeal",
    description: null,
    pricePence: null, labelCategoryName: "Vegetarian", packG: 143,
    nutrition: [212, 893, 9.2, 1.6, 24, 2.1, 4.1, 9.7, 0.83],
    components: ["Wholemeal Bread", "Free Range Eggs", "Mayonnaise", "Cress", "Salt & Black Pepper"],
  },
  {
    name: "Cheese, Pickle and Salad Bloomer",
    description: "Mature sliced cheddar, Branston pickle with salad on white bloomer",
    pricePence: 479, labelCategoryName: "Vegetarian", packG: 153,
    nutrition: [262, 1103, 11, 5.9, 30, 2.8, 1.8, 12, 1.2],
    components: ["White Bloomer", "Sliced Mild Cheddar", "Branston Sweet Pickle", "Mixed Salad Leaf", "Cucumber", "Tomatoes", "Sunflower Spread"],
  },
  // ---- blank range sheet only (recipes from known components; check specs) ----
  {
    name: "Hoisin Duck Wrap",
    description: "Shredded duck with hoisin sauce, cucumber and spring onion",
    pricePence: 499, labelCategoryName: "Chicken", packG: null, nutrition: null,
    components: ["Tortilla Wrap", "Shredded Duck", "Hoisin Sauce", "Cucumber", "Spring Onions"],
  },
  {
    name: "Southern Fried Chicken Wrap",
    description: "Southern fried chicken with mayo and leaf",
    pricePence: 479, labelCategoryName: "Chicken", packG: null, nutrition: null,
    components: ["Tortilla Wrap", "Southern Fried Chicken", "Mayonnaise", "Mixed Salad Leaf"],
  },
  {
    name: "Ham and Egg on White Bread",
    description: "Wiltshire ham and free range egg mayo on white bread",
    pricePence: 379, labelCategoryName: "Red meat", packG: null, nutrition: null,
    components: ["White Bread", "Wiltshire Ham", "Free Range Eggs", "Mayonnaise", "Sunflower Spread"],
  },
  {
    name: "Ham, Cheese & Salad Wrap",
    description: "Wiltshire ham, cheddar and salad in a wrap",
    pricePence: 449, labelCategoryName: "Red meat", packG: null, nutrition: null,
    components: ["Tortilla Wrap", "Wiltshire Ham", "Mature Cheddar", "Mixed Salad Leaf", "Cucumber", "Tomatoes"],
  },
  {
    name: "Ham, Mustard & Tomato on Brown Bloomer",
    description: "Wiltshire ham with mustard and tomato on malted bloomer",
    pricePence: 479, labelCategoryName: "Red meat", packG: null, nutrition: null,
    components: ["Malted Bloomer", "Wiltshire Ham", "English Mustard", "Tomatoes", "Sunflower Spread"],
  },
  {
    name: "Roast Beef, Horseradish & Salad on Malted Bread",
    description: "Roast beef with horseradish and salad on malted bread",
    pricePence: 375, labelCategoryName: "Red meat", packG: null, nutrition: null,
    components: ["Malted Sandwich Bread", "Sliced Roast Beef", "Horseradish Sauce", "Mixed Salad Leaf", "Tomatoes", "Sunflower Spread"],
  },
  {
    name: "Falafel, Hummus & Sundried Tomato on Malted Bread",
    description: "Falafel and hummus with sundried tomatoes on malted bread",
    pricePence: 379, labelCategoryName: "Vegetarian", packG: null, nutrition: null,
    components: ["Malted Sandwich Bread", "Falafel", "Hummus", "Sundried Tomatoes", "Mixed Salad Leaf"],
  },
  {
    name: "Chicken Salad on Malted Bloomer",
    description: "Chicken breast with salad on malted bloomer",
    pricePence: 295, labelCategoryName: "Chicken", packG: null, nutrition: null,
    components: ["Malted Bloomer", "Chicken Breast", "Mixed Salad Leaf", "Cucumber", "Tomatoes", "Mayonnaise", "Sunflower Spread"],
  },
];

async function main() {
  const wrapSize = await db.query.labelSizes.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.template, "wrap"),
  });
  if (!wrapSize) throw new Error("No wrap label size");
  const wrapSizeId = wrapSize.id;

  // 1. Brand templates
  async function upsertBrand(values: typeof brandTemplates.$inferInsert) {
    const existing = await db.query.brandTemplates.findFirst({
      where: eq(brandTemplates.name, values.name),
    });
    if (existing) {
      await db.update(brandTemplates).set(values).where(eq(brandTemplates.id, existing.id));
      return existing.id;
    }
    const [row] = await db.insert(brandTemplates).values(values).returning({ id: brandTemplates.id });
    return row.id;
  }
  const businessName = "Eatpure Ltd, Unit 5 Sutherland Court";
  const businessAddress = "Welwyn Garden City, AL7 1BJ";
  const surfinId = await upsertBrand({
    name: "Surfin",
    businessName,
    businessAddress,
    logoDataUrl: logos.surfin,
    labelSizeId: wrapSizeId,
    tintLogo: false,
    showStars: false,
    innerBorder: false,
    borderColorHex: "#000000",
  });
  const hertsId = await upsertBrand({
    name: "Herts Station",
    businessName,
    businessAddress,
    logoDataUrl: logos.mindthegap,
    labelSizeId: wrapSizeId,
    tintLogo: false,
    showStars: false,
    innerBorder: false,
    borderColorHex: null,
  });
  console.log(`Brands: Surfin #${surfinId}, Herts Station #${hertsId}`);

  // 2. New components
  const allergenRows = await db.query.allergens.findMany();
  const allergenBySlug = new Map(allergenRows.map((a) => [a.slug, a.id]));
  for (const comp of NEW_COMPONENTS) {
    const existing = await db.query.ingredients.findFirst({
      where: eq(ingredients.name, comp.name),
    });
    if (existing) continue;
    const [row] = await db
      .insert(ingredients)
      .values({ name: comp.name, labelDeclaration: comp.declaration })
      .returning();
    for (const slug of comp.allergens) {
      const allergenId = allergenBySlug.get(slug);
      if (!allergenId) throw new Error(`Unknown allergen slug ${slug}`);
      await db
        .insert(ingredientAllergens)
        .values({ ingredientId: row.id, allergenId })
        .onConflictDoNothing();
    }
    console.log(`Created component "${comp.name}".`);
  }

  // 3. New products
  const categories = await db.query.labelCategories.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c.id]));
  for (const item of NEW_PRODUCTS) {
    const existing = await db.query.products.findFirst({
      where: eq(products.name, item.name),
    });
    if (existing) continue;
    const n = item.nutrition;
    const [product] = await db
      .insert(products)
      .values({
        name: item.name,
        slug: item.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        category: "Sandwiches",
        description: item.description,
        pricePence: item.pricePence,
        labelCategoryId: categoryByName.get(item.labelCategoryName) ?? null,
        shelfLifeValue: 2,
        shelfLifeUnit: "days",
        shelfLifeType: "use_by",
        storageInstructions: "Keep Refrigerated 5°c",
        nutritionOverride: n
          ? {
              energyKcal: n[0], energyKj: n[1], fatG: n[2], saturatesG: n[3],
              carbohydrateG: n[4], sugarsG: n[5], fibreG: n[6], proteinG: n[7], saltG: n[8],
            }
          : null,
        packWeightGrams: item.packG,
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

  // 4. Standing orders
  const productIdByName = new Map<string, { id: number; pricePence: number | null }>();
  async function resolveProduct(name: string) {
    const target = NAME_LINKS[name] ?? name;
    let hit = productIdByName.get(target);
    if (!hit) {
      const row = await db.query.products.findFirst({
        where: eq(products.name, target),
      });
      if (!row) throw new Error(`Product not in DB: "${name}" (as "${target}")`);
      hit = { id: row.id, pricePence: row.pricePence };
      productIdByName.set(target, hit);
    }
    return hit;
  }

  async function replaceOrder(
    orderName: string,
    brandId: number,
    items: Item[],
    opts: { hidePrices?: boolean; zeroQuantities?: boolean } = {}
  ) {
    const existing = await db.query.standingOrders.findFirst({
      where: eq(standingOrders.name, orderName),
    });
    if (existing) await db.delete(standingOrders).where(eq(standingOrders.id, existing.id));
    const [order] = await db
      .insert(standingOrders)
      .values({ name: orderName, brandTemplateId: brandId, labelSizeId: wrapSizeId })
      .returning({ id: standingOrders.id });
    for (const item of items) {
      const product = await resolveProduct(item.name);
      const itemPence = pence(item.price);
      await db.insert(standingOrderItems).values({
        standingOrderId: order.id,
        productId: product.id,
        quantity: opts.zeroQuantities ? 0 : item.qty,
        pricePenceOverride: opts.hidePrices
          ? 0 // 0 = print no price on this customer's labels
          : itemPence != null && itemPence !== product.pricePence
            ? itemPence
            : null,
      });
    }
    const total = opts.zeroQuantities ? 0 : items.reduce((a, b) => a + b.qty, 0);
    console.log(`Standing order "${orderName}": ${items.length} lines, ${total} labels.`);
  }

  await replaceOrder("7b i Surfin Amp Mon", surfinId, load("surfin-amp-mon"));
  await replaceOrder("7b ii Surfin Amp Weds", surfinId, load("surfin-amp-weds"));
  await replaceOrder("7b iii Surfin Amp Fri", surfinId, load("surfin-amp-fri"));
  await replaceOrder("7c i Surfin Bigg Mon", surfinId, load("surfin-bigg-mon"));
  await replaceOrder("7c ii Surfin Bigg Weds", surfinId, load("surfin-bigg-weds"));
  await replaceOrder("7c iii Surfin Bigg Fri", surfinId, load("surfin-bigg-fri"));
  await replaceOrder("8a Herts Station Monday", hertsId, load("herts-mon"), { hidePrices: true });
  await replaceOrder("8b Herts Station Weds", hertsId, load("herts-weds"), { hidePrices: true });
  await replaceOrder("8c Herts Station Friday", hertsId, load("herts-fri"), { hidePrices: true });
  // The template: the customer's full range, every quantity zero
  await replaceOrder("8 Herts Station Blank", hertsId, load("herts-blank"), {
    hidePrices: true,
    zeroQuantities: true,
  });

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
