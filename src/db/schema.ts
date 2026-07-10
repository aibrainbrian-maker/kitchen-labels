import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  date,
  jsonb,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const shelfLifeUnitEnum = pgEnum("shelf_life_unit", ["hours", "days", "weeks"]);
export const shelfLifeTypeEnum = pgEnum("shelf_life_type", ["use_by", "best_before"]);
export const labelSizeKindEnum = pgEnum("label_size_kind", ["sheet_grid", "thermal_roll"]);
export const labelTemplateEnum = pgEnum("label_template", ["simple", "wrap", "pot"]);
export const printRunStatusEnum = pgEnum("print_run_status", ["completed", "voided"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// The 14 UK/EU regulated allergens — seeded once, never edited via the app.
export const allergens = pgTable("allergens", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  // Full compound declaration printed on labels in place of the short name,
  // e.g. "White Bloomer (WHEAT Flour, Water, Yeast, ...)". Natasha's Law
  // requires compound bought-in ingredients to be broken down like this.
  labelDeclaration: text("label_declaration"),
  // Nutrition per 100g, standard UK/EU panel
  energyKcal: real("energy_kcal").notNull().default(0),
  energyKj: real("energy_kj").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  saturatesG: real("saturates_g").notNull().default(0),
  carbohydrateG: real("carbohydrate_g").notNull().default(0),
  sugarsG: real("sugars_g").notNull().default(0),
  fibreG: real("fibre_g").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  saltG: real("salt_g").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ingredientAllergens = pgTable(
  "ingredient_allergens",
  {
    ingredientId: integer("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "cascade" }),
    allergenId: integer("allergen_id")
      .notNull()
      .references(() => allergens.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.ingredientId, t.allergenId] })]
);

// Colour-coded product categories shown as the label border colour, e.g.
// red = red meat, yellow = chicken, green = vegetarian, blue = seafood.
export const labelCategories = pgTable("label_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  colorHex: text("color_hex").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Single-row-per-key settings: business name/address for the label footer,
// uploaded logo (as a data URL), etc.
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const labelSizes = pgTable("label_sizes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kind: labelSizeKindEnum("kind").notNull().default("sheet_grid"),
  template: labelTemplateEnum("template").notNull().default("simple"),
  isCustom: boolean("is_custom").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  widthMm: real("width_mm").notNull(),
  heightMm: real("height_mm").notNull(),
  // sheet_grid only
  sheetWidthMm: real("sheet_width_mm"),
  sheetHeightMm: real("sheet_height_mm"),
  cols: integer("cols"),
  rows: integer("rows"),
  marginTopMm: real("margin_top_mm"),
  marginLeftMm: real("margin_left_mm"),
  gapXMm: real("gap_x_mm"),
  gapYMm: real("gap_y_mm"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category"),
  description: text("description"),
  pricePence: integer("price_pence"),
  labelCategoryId: integer("label_category_id").references(() => labelCategories.id),
  // Supplier-provided finished-product nutrition per 100g. When set, it takes
  // precedence over the value derived from the recipe (used for bought-in or
  // externally analysed products where per-ingredient data isn't available).
  nutritionOverride: jsonb("nutrition_override"),
  packWeightGrams: real("pack_weight_grams"),
  // True for catalogue-imported products whose recipe weights are descending
  // placeholders that only encode the printed ingredient order. While set,
  // recipe-derived nutrition must not be shown (it would be meaningless).
  placeholderWeights: boolean("placeholder_weights").notNull().default(false),
  shelfLifeValue: integer("shelf_life_value").notNull().default(1),
  shelfLifeUnit: shelfLifeUnitEnum("shelf_life_unit").notNull().default("days"),
  shelfLifeType: shelfLifeTypeEnum("shelf_life_type").notNull().default("use_by"),
  storageInstructions: text("storage_instructions"),
  defaultLabelSizeId: integer("default_label_size_id").references(() => labelSizes.id),
  isActive: boolean("is_active").notNull().default(true),
  isFavorite: boolean("is_favorite").notNull().default(false),
  printCount: integer("print_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// The recipe / bill-of-materials. Ingredient order, allergens, and nutrition
// for a product are all DERIVED from this table (see src/lib/nutrition.ts) —
// never stored redundantly, so they can never drift out of sync.
export const productIngredients = pgTable("product_ingredients", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  ingredientId: integer("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  weightGrams: real("weight_grams").notNull(),
});

// Per-customer/café branding printed on labels: logo, business name/address,
// and the label set-up (sheet layout) that customer's labels print on.
export const brandTemplates = pgTable("brand_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Eatlunch Café"
  businessName: text("business_name"),
  businessAddress: text("business_address"),
  logoDataUrl: text("logo_data_url"),
  labelSizeId: integer("label_size_id").references(() => labelSizes.id),
  isDefault: boolean("is_default").notNull().default(false),
  // Recolour the logo to the label's category colour (LabelLogic-style theme,
  // e.g. the eatlunch heart prints orange on Chicken labels, red on Red meat).
  tintLogo: boolean("tint_logo").notNull().default(false),
  // Row of five stars in the category colour above the logo.
  showStars: boolean("show_stars").notNull().default(false),
  // Thin rule just inside the thick category-colour frame (J&O design).
  innerBorder: boolean("inner_border").notNull().default(false),
  // Fixed label border colour for this brand (e.g. Surfin prints all labels
  // with a black frame). Null = use the product category's colour.
  borderColorHex: text("border_color_hex"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandTemplatesRelations = relations(brandTemplates, ({ one }) => ({
  labelSize: one(labelSizes, {
    fields: [brandTemplates.labelSizeId],
    references: [labelSizes.id],
  }),
}));

// A saved print list for customers with a standing order: re-loadable into
// the print screen with one click.
export const standingOrders = pgTable("standing_orders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Riverside Café — Tuesdays"
  brandTemplateId: integer("brand_template_id").references(() => brandTemplates.id),
  labelSizeId: integer("label_size_id").references(() => labelSizes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const standingOrderItems = pgTable("standing_order_items", {
  id: serial("id").primaryKey(),
  standingOrderId: integer("standing_order_id")
    .notNull()
    .references(() => standingOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  // Customer-specific price: some standing-order customers pay a different
  // price than the product's catalogue price, and their labels must show it.
  // 0 means "print no price on this customer's labels".
  pricePenceOverride: integer("price_pence_override"),
});

export const printRuns = pgTable("print_runs", {
  id: serial("id").primaryKey(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  printedBy: text("printed_by"),
  labelSizeId: integer("label_size_id")
    .notNull()
    .references(() => labelSizes.id),
  brandTemplateId: integer("brand_template_id").references(() => brandTemplates.id),
  startAtPosition: integer("start_at_position").notNull().default(1),
  status: printRunStatusEnum("status").notNull().default("completed"),
  notes: text("notes"),
});

// Snapshot fields are mandatory for food-safety traceability: if a product's
// recipe is edited later, historical print records must still reflect exactly
// what was printed on the day, not the current recipe.
export const printRunItems = pgTable("print_run_items", {
  id: serial("id").primaryKey(),
  printRunId: integer("print_run_id")
    .notNull()
    .references(() => printRuns.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  prepDate: date("prep_date").notNull(),
  computedExpiryDate: date("computed_expiry_date").notNull(),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  ingredientsSnapshot: jsonb("ingredients_snapshot").notNull(),
  allergensSnapshot: jsonb("allergens_snapshot").notNull(),
  nutritionSnapshot: jsonb("nutrition_snapshot").notNull(),
});

export const allergensRelations = relations(allergens, ({ many }) => ({
  ingredientAllergens: many(ingredientAllergens),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  ingredientAllergens: many(ingredientAllergens),
  productIngredients: many(productIngredients),
}));

export const ingredientAllergensRelations = relations(ingredientAllergens, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [ingredientAllergens.ingredientId],
    references: [ingredients.id],
  }),
  allergen: one(allergens, {
    fields: [ingredientAllergens.allergenId],
    references: [allergens.id],
  }),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  productIngredients: many(productIngredients),
  defaultLabelSize: one(labelSizes, {
    fields: [products.defaultLabelSizeId],
    references: [labelSizes.id],
  }),
  labelCategory: one(labelCategories, {
    fields: [products.labelCategoryId],
    references: [labelCategories.id],
  }),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, {
    fields: [productIngredients.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [productIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const printRunsRelations = relations(printRuns, ({ many, one }) => ({
  items: many(printRunItems),
  labelSize: one(labelSizes, {
    fields: [printRuns.labelSizeId],
    references: [labelSizes.id],
  }),
  brandTemplate: one(brandTemplates, {
    fields: [printRuns.brandTemplateId],
    references: [brandTemplates.id],
  }),
}));

export const standingOrdersRelations = relations(standingOrders, ({ many, one }) => ({
  items: many(standingOrderItems),
  brandTemplate: one(brandTemplates, {
    fields: [standingOrders.brandTemplateId],
    references: [brandTemplates.id],
  }),
  labelSize: one(labelSizes, {
    fields: [standingOrders.labelSizeId],
    references: [labelSizes.id],
  }),
}));

export const standingOrderItemsRelations = relations(standingOrderItems, ({ one }) => ({
  standingOrder: one(standingOrders, {
    fields: [standingOrderItems.standingOrderId],
    references: [standingOrders.id],
  }),
  product: one(products, {
    fields: [standingOrderItems.productId],
    references: [products.id],
  }),
}));

export const printRunItemsRelations = relations(printRunItems, ({ one }) => ({
  printRun: one(printRuns, {
    fields: [printRunItems.printRunId],
    references: [printRuns.id],
  }),
  product: one(products, {
    fields: [printRunItems.productId],
    references: [products.id],
  }),
}));
