// Shared component ingredients for the Eatpure sandwich catalogue import.
// Each component is a bought-in compound ingredient: short name for the UI,
// full label declaration (as printed by the previous LabelLogic system), and
// the regulated allergens it carries.
//
// Allergen slugs must match src/db/seed.ts THE_14_ALLERGENS.

export type Component = {
  name: string;
  declaration: string | null;
  allergens: string[];
};

const GLUTEN = "cereals-containing-gluten";

export const COMPONENTS: Component[] = [
  // ---------- Breads ----------
  {
    name: "White Bread",
    declaration:
      "White Bread (WHEAT Flour [with added Calcium Carbonate, Iron, Niacin, Thiamin], Water, Salt, Yeast, Spirit Vinegar, WHEAT Protein, Emulsifiers [E471, E472(e)], Vegetable Oils [Rapeseed, Palm], Flour Treatment Agent [E300], Palm Fat)",
    allergens: [GLUTEN],
  },
  {
    name: "Medium Sliced White Bread",
    declaration:
      "Medium Sliced White Bread (WHEAT Flour [with added Calcium Carbonate, Niacin, Iron, Thiamin], Water, Salt, Yeast, Spirit Vinegar, WHEAT Protein, Emulsifiers [E471, E472e], Vegetable Oils [Rapeseed, Palm], Preservative: Calcium Propionate, Palm Fat, Flour Treatment Agent: Ascorbic Acid (Vitamin C), WHEAT Flour, WHEAT Starch)",
    allergens: [GLUTEN],
  },
  {
    name: "Soft White Bread",
    declaration:
      "White Bread (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Palm Oil, Salt, Yeast, SOYA Flour, Emulsifiers (Mono- and Di-Glycerides of Fatty Acids, Mono- and Di-Acetyl Tartaric Acid Esters of Mono- and Di-Glycerides of Fatty Acids), Spirit Vinegar, Preservative (Calcium Propionate), Flour Treatment Agent (Ascorbic Acid))",
    allergens: [GLUTEN, "soybeans"],
  },
  {
    name: "White Bloomer",
    declaration:
      "White Bloomer (WHEAT FLOUR (WHEAT Flour, Calcium Carbonate, Iron, Niacin, Thiamin), Water, Yeast, Salt, Palm Oil, Rapeseed Oil, Emulsifiers [Mono and di-glycerides of fatty acids, Mono and di-acetyltartaric acid esters of mono and di-glycerides of fatty acids], BARLEY Malt Flour, Flour treatment agent [Ascorbic Acid])",
    allergens: [GLUTEN],
  },
  {
    name: "Strong White Bloomer",
    declaration:
      "White Bloomer (Strong WHEAT Flour (67%) [WHEAT Flour, Calcium Carbonate, Niacin, Iron, Thiamine], Water, Fermented WHEAT Flour (10%), Salt, Fresh Yeast; Fermented WHEAT Flour contains: Water, Strong WHEAT Flour (37%) [WHEAT Flour, Calcium Carbonate, Niacin, Iron, Thiamine])",
    allergens: [GLUTEN],
  },
  {
    name: "Malted Bloomer",
    declaration:
      "Malted Bloomer (WHEAT Flour [with added Calcium Carbonate, Niacin, Iron, Folic Acid, Thiamin], Water, Malted WHEAT Flakes (9.0%), WHEAT Bran (2.3%), Yeast, Malted BARLEY Flour (1.0%), Salt, Vegetable Oils [Rapeseed, Palm], WHEAT Protein, Spirit Vinegar, Emulsifiers [E471, E472e], Malted WHEAT Flour, Flour Treatment Agent (E300), Palm Fat, WHEAT Flour)",
    allergens: [GLUTEN],
  },
  {
    name: "Malted Sandwich Bread",
    declaration:
      "Malted Bread (WHEAT flour, water, malted WHEAT flakes, bran (WHEAT), yeast, salt, malt flour (BARLEY), vinegar, emulsifiers (mono- and diacetyl tartaric acid esters of mono- and diglycerides of fatty acids, mono- and diglycerides of fatty acids), malt flour (WHEAT), vegetable protein (WHEAT), rapeseed oil, flour treatment agent (ascorbic acid))",
    allergens: [GLUTEN],
  },
  {
    name: "Wholemeal Bread",
    declaration:
      "Wholemeal Bread (Wholemeal WHEAT Flour, Water, WHEAT Protein, Yeast, Salt, Emulsifiers (E472, E471), Spirit Vinegar, Rapeseed Oil, Flour Treatment Agent (E300))",
    allergens: [GLUTEN],
  },
  {
    name: "White Roll",
    declaration:
      "White Roll (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Yeast, Roll Improver [Salt, WHEAT Flour, SOYA Flour (with Calcium, Iron, Niacin, Thiamin), Rapeseed Oil, Calcium Sulphate, Flour Treatment Agent (Ascorbic Acid, L-Cysteine Hydrochloride)])",
    allergens: [GLUTEN, "soybeans"],
  },
  {
    name: "Granary Roll",
    declaration:
      "Brown Roll (Wholemeal WHEAT Flour, WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Yeast, Malted BARLEY, Salt, WHEAT Gluten, Emulsifier (Mono- and Di-Acetyl Tartaric Acid Esters of Mono- and Di-Glycerides of Fatty Acids), Rapeseed Oil, Flour Treatment Agent (Ascorbic Acid))",
    allergens: [GLUTEN],
  },
  {
    name: "Gluten Free White Bread",
    declaration:
      "Gluten Free White Bread (Water, Rice Flour, Tapioca Starch, Maize Starch, Rapeseed Oil, Psyllium Husk, Rice Protein, Emulsifier (Cellulose Fibre), Golden Syrup, Potato Starch, Thickener (Cellulose), Yeast, Salt, Rice Starch, Buckwheat Flour, Golden Flax Seed, Stabiliser (Xanthan Gum))",
    allergens: [],
  },
  {
    name: "Panini",
    declaration:
      "Panini (WHEAT Flour, Water, Yeast, Non Hydrogenated Vegetable Oil (Rapeseed), Salt, Dextrose, Flour Treatment Agent: Ascorbic Acid)",
    allergens: [GLUTEN],
  },
  {
    name: "Ciabatta Roll",
    declaration:
      "Ciabatta Roll (WHEAT Flour, Water, Durum WHEAT Semolina, WHEAT Sour Dough (Water, WHEAT Flour), Yeast, Extra Virgin Olive Oil, RYE Flour, Salt, BARLEY Malt Extract)",
    allergens: [GLUTEN],
  },
  {
    name: "White Baguette",
    declaration:
      "White Baguette (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Yeast, Salt, Dextrose, Flour Treatment Agent (Ascorbic Acid))",
    allergens: [GLUTEN],
  },
  {
    name: "Tortilla Wrap",
    declaration:
      "Soft Tortilla Wrap (Fortified WHEAT Flour (WHEAT Flour, Calcium Carbonate, Iron, Niacin, Thiamin), Water, Vegetable Oils (Palm Oil, Rapeseed Oil), Raising Agents (Malic Acid, Sodium Carbonates, Diphosphates), Sugar, Salt)",
    allergens: [GLUTEN],
  },
  {
    name: "Plain Bagel",
    declaration: "Bagel, plain (WHEAT)",
    allergens: [GLUTEN],
  },
  {
    name: "Brioche Bun",
    declaration:
      "Brioche Bun (WHEAT Flour (With Calcium, Iron, Niacin And Thiamin), Water, Sugar, Yeast, Glaze (Water, Vegetable Protein, Sunflower Oil, Dextrose, Maltodextrin, Maize Starch), Butter (MILK) (1.5%), Salt, Whole EGG, EGG White, Dextrose, Emulsifier (E472e), Dried Skimmed MILK, Colour (E160aiii), Flour Treatment Agent (E300), Rapeseed Oil)",
    allergens: [GLUTEN, "milk", "eggs"],
  },
  {
    name: "All Butter Croissant",
    declaration:
      "All Butter Croissant (WHEAT Flour (WHEAT Gluten), Butter (MILK) (20.6%), Water, Yeast, Sugar, Salt, Baking Improver (WHEAT Gluten, WHEAT Flour, Flour Treatment Agent (Ascorbic Acid E300), enzyme), EGG, Topping: EGG Wash)",
    allergens: [GLUTEN, "milk", "eggs"],
  },
  {
    name: "English Muffin",
    declaration:
      "English Muffin (WHEAT flour, Water, dried whole MILK, yeast, vegetable oil, semolina, salt, SOYA flour, acidity regulator E170, emulsifiers E472e, E481)",
    allergens: [GLUTEN, "milk", "soybeans"],
  },
  {
    name: "Macaroni",
    declaration: "Macaroni (Durum WHEAT Semolina)",
    allergens: [GLUTEN],
  },

  // ---------- Meats, fish & proteins ----------
  {
    name: "Cumberland Sausage",
    declaration:
      "Cumberland Sausage (Pork (65%), Water, Rusk (Salt, WHEAT Flour e503-ii), WHEAT Flour, Salt, pea starch, emulsifier sodium diphosphate (e450a), flavour enhancer (e621), Herbs, Spice Extracts, preservative (e223) (SULPHUR DIOXIDE (SULPHITES)))",
    allergens: [GLUTEN, "sulphites"],
  },
  {
    name: "Streaky Bacon",
    declaration:
      "Bacon Rashers, Streaky (Pork (87%), Water, Salt, Preservatives (Sodium Nitrite, Potassium Nitrate), Antioxidant (Sodium Ascorbate))",
    allergens: [],
  },
  {
    name: "Smoked Streaky Bacon",
    declaration: "Cooked Smoked Streaky Bacon (Pork (98%), Salt, Preservative E250)",
    allergens: [],
  },
  {
    name: "Cooked Back Bacon",
    declaration:
      "Cooked Back Bacon (Pork Loin, Water, Salt, Preservative (Sodium Nitrite E250, Potassium Nitrate E252), Antioxidant (Sodium Ascorbate E301))",
    allergens: [],
  },
  { name: "Free Range Eggs", declaration: "Free Range EGGS", allergens: ["eggs"] },
  {
    name: "Hardboiled Egg",
    declaration:
      "Hardboiled EGG (Hen EGGS 100%, Preservative Solution (water, citric acid (E330), Trisodium citrate))",
    allergens: ["eggs"],
  },
  {
    name: "Omelette",
    declaration:
      "Omelette (EGG (67%), MILK, EGG White, Rapeseed Oil, Thickener (Xanthan Gum), Salt, White Pepper)",
    allergens: ["eggs", "milk"],
  },
  {
    name: "Chicken Breast",
    declaration: "Cooked Chicken Breast (Chicken, Salt)",
    allergens: [],
  },
  {
    name: "Southern Fried Chicken",
    declaration:
      "Southern Fried Chicken (Chicken Breast (63%), Water, WHEAT Flour, Modified Tapioca Starch, Palm Oil, Corn Starch, Potato Starch, Tapioca Starch, Rice Flour, Salt, Spices (MUSTARD Powder, White Pepper, Black Pepper), Herbs (Sage, CELERY, Fennel, Thyme), Raising Agents (Disodium Diphosphate, Sodium Bicarbonate), Garlic, Onion, dextrose, WHEAT Gluten, Sugar, Yeast Extract, Natural Flavouring, Natural Colouring (Paprika Extract), Yeast, Garlic Powder, Onion Powder, Thickener (Xanthan Gum), Black Pepper Extract, Capsicum Extract)",
    allergens: [GLUTEN, "mustard", "celery"],
  },
  {
    name: "Coronation Chicken",
    declaration:
      "Coronation Chicken (42%) (Chicken (Chicken Breast, Salt, Stabiliser E451), Coronation Mayonnaise (Rapeseed Oil, Water, Mango Puree, Sugar, Apple Puree, Thickener Modified Corn Starch, Spices, MUSTARD, Salt, Pasteurised EGG Yolk, Acidity Regulator E260, Stabilisers E415, E410, Onion, Garlic, Tomato, Flavouring, Acidity Regulator E330, Colours E160a, E161b, Preservative E202, Stabiliser E385), Mango Chutney (Sugar, Mango, Salt, Acidity Regulator E260, Garlic, Ginger, Chilli), Sultanas (Sultanas, Cottonseed Oil), Apricots (Apricots, Sugar))",
    allergens: ["mustard", "eggs"],
  },
  {
    name: "Chorizo",
    declaration:
      "Chorizo (Pork belly cut, pork (UE origin), salt, SOY PROTEIN, WHEY MILK PERMEATE, paprika, garlic, dextrose, natural aroma, emulsifiers (E-450, E-452), spices, dyes (E-160c, E-120), antioxidants (E-316), preservatives (E-250, E-252), ferments)",
    allergens: ["soybeans", "milk"],
  },
  {
    name: "Wiltshire Ham",
    declaration:
      "Wiltshire Ham (Pork (90%), Water, Salt, Potato Starch, Stabilisers (Carrageenan, Diphosphates, Triphosphates), Dextrose, Honey, Antioxidant (Sodium Ascorbate), Preservative (Sodium Nitrite))",
    allergens: [],
  },
  {
    name: "Sliced Cooked Ham",
    declaration:
      "Sliced Cooked Ham (Pork Leg, Salt, Stabilisers (Triphosphates, Diphosphates), Sugar, Yeast Extract, Dextrose, Antioxidants (Sodium ascorbate, Sodium citrate), Preservative (Sodium nitrite), Natural Flavouring)",
    allergens: [],
  },
  { name: "Gammon Ham", declaration: "Ham, Gammon Joint", allergens: [] },
  {
    name: "Pastrami",
    declaration:
      "Sliced Pastrami (Irish Beef, Salt, Sugar (Dried Glucose & Maltodextrin), Starch, Cracked Black Pepper, Stabilisers (Diphosphates & Triphosphates), Gelling agent (Carrageenan), Antioxidant (Sodium Ascorbate), Preservative (Sodium Nitrite))",
    allergens: [],
  },
  {
    name: "Swedish Meatballs",
    declaration:
      "Swedish Meatballs (Pork and beef 70%, onions, potatoes, potato starch, potato flakes, potato fibers, sugar, salt, dextrose, beef stock, natural aroma, spice extract)",
    allergens: [],
  },
  {
    name: "Pork Gyros",
    declaration:
      "Greek Pork Gyros (Pork Meat 92%, Salt, Paprika, Onion, Dextrose, Spice, Black Pepper, Yeast Extract, Cumin, Oregano, Tomato, Potato Starch, Stabilizer [E450, E451], Transglutaminase, Potato Fibre, Modified Starch, Antioxidant (Trisodium Citrate), Bamboo Fibre, Maize Starch, Sugar, Rice Starch)",
    allergens: [],
  },
  {
    name: "Sliced Roast Beef",
    declaration:
      "Sliced Beef (100% Beef, Modified starch, pea starch, dextrose, salt, stabilisers (E451, E450, E452), gelling agent (E407), colour (E150c))",
    allergens: [],
  },
  {
    name: "Pepperoni",
    declaration:
      "Sliced Pepperoni (Pork, Salt, Flavourings, Dextrose, Spices, Smoke Flavourings, Antioxidant (E301), Preservatives (E252, E250))",
    allergens: [],
  },
  { name: "Tuna", declaration: "Tuna (FISH)", allergens: ["fish"] },
  {
    name: "Tuna Mayonnaise",
    declaration:
      "Tuna Mayonnaise (TUNA (FISH) (60%), water, salt, Mayonnaise (40%) (Water, rapeseed oil, spirit vinegar, modified starch, EGG yolk, sugar, salt, MUSTARD, stabiliser [guar gum]))",
    allergens: ["fish", "eggs", "mustard"],
  },
  { name: "Prawns", declaration: "Prawns (CRUSTACEANS)", allergens: ["crustaceans"] },
  {
    name: "Smoked Salmon",
    declaration:
      "Smoked Salmon (Farmed Atlantic Salmon (FISH) (96%), Salt (3%), Sugar (1%))",
    allergens: ["fish"],
  },
  {
    name: "Fresh Salmon Fillet",
    declaration: "Salmon Fillet (Salmon (FISH) (100%) (Salmo salar))",
    allergens: ["fish"],
  },
  {
    name: "Vegan Ham",
    declaration:
      "Vegan Ham (Rehydrated pea proteins 91%, SOY PROTEIN, natural flavouring, radish concentrate juice, salt, acidity regulator: potassium acetates, preservative: vegan lactic acid)",
    allergens: ["soybeans"],
  },

  // ---------- Cheeses ----------
  {
    name: "Mature Cheddar",
    declaration: "Cheddar Cheese, White Mature Cheddar (MILK)",
    allergens: ["milk"],
  },
  {
    name: "Sliced Mild Cheddar",
    declaration: "Sliced Mild Cheddar (MILK, salt, starter, microbial rennet)",
    allergens: ["milk"],
  },
  {
    name: "Red Leicester",
    declaration: "Cheese, Red Leicester (MILK)",
    allergens: ["milk"],
  },
  { name: "Brie", declaration: "Brie (MILK)", allergens: ["milk"] },
  {
    name: "Emmental",
    declaration: "Sliced Emmental (MILK, salt, starter, microbial rennet)",
    allergens: ["milk"],
  },
  {
    name: "Mozzarella",
    declaration: "Sliced Mozzarella (MILK, salt, starter, microbial rennet)",
    allergens: ["milk"],
  },
  {
    name: "Grated Mozzarella & Cheddar",
    declaration:
      "Grated Mozzarella/Cheddar (Pasteurised Full Fat MILK, Starter, Rennet, Salt, Potato Starch)",
    allergens: ["milk"],
  },
  { name: "Feta", declaration: "Cheese, Feta (MILK)", allergens: ["milk"] },
  {
    name: "Blue Stilton",
    declaration:
      "Blue Stilton (Pasteurised Cows MILK, Salt, Vegetarian Rennet, Penicillium Roqueforti, Starter Cultures)",
    allergens: ["milk"],
  },
  {
    name: "Cream Cheese",
    declaration:
      "Cream Cheese (Skim MILK, Cream (MILK), Lactic Cultures, Salt, MILK Protein, Potassium Sorbate)",
    allergens: ["milk"],
  },
  {
    name: "Vegan Cheddar Slices",
    declaration:
      "Vegan Cheddar Flavour Slices (Water, Coconut Oil (non-hydrogenated) (24%), Modified starch, Starch, sea salt, Vegan Flavourings, Colour: Beta Carotene, Olive Extract, Vitamin B12)",
    allergens: [],
  },
  {
    name: "Vegan Slice (Kerrymaid)",
    declaration:
      "Vegan Slice (Water, Sustainably Sourced Coconut Oil (min 23%), Tapioca Starch, Pea Protein, Modified Potato Starch, Salt, Stabiliser (Carrageenan), Natural Flavourings, Acidity Regulator (Citric acid), Colours (Paprika Extract, Beta-carotene))",
    allergens: [],
  },
  {
    name: "Cheese Savoury Mix",
    declaration:
      "Cheese Savoury (39% mayonnaise (water, rapeseed oil, sugar, thickener (modified starch), salt, acidity regulator (acetic acid), EGG yolk, stabilisers (xantham gum, guar gum), preservatives (potassium sorbate, sodium benzoate), flavouring, colour (beta carotene)), 30% cheddar cheese (pasteurised full fat MILK, salt, starter culture, vegetarian rennet, potato starch, e160b(ii) annatto), 25% carrot, 6% onion)",
    allergens: ["eggs", "milk"],
  },

  // ---------- Sauces, dressings & condiments ----------
  {
    name: "Mayonnaise",
    declaration:
      "Mayonnaise (rapeseed oil, water, modified starch, pasteurised EGG yolk, salt, acidity regulator (Acetic Acid), Dairy Protein (MILK), MUSTARD, stabilisers (xantham gum, guar gum), preservatives (Potassium, Sodium benzoate))",
    allergens: ["eggs", "milk", "mustard"],
  },
  {
    name: "Mayonnaise (egg powder recipe)",
    declaration:
      "Mayonnaise (Rapeseed Oil, Water, Sugar, EGG Powder, Salt, Acetic Acid, Citric Acid, Potassium Sorbate, Modified Maize Starch, Xanthan Gum, Guar Gum)",
    allergens: ["eggs"],
  },
  {
    name: "Vegan Mayonnaise",
    declaration:
      "Vegan Mayonnaise (Rapeseed Oil, Water, Tapioca Starch, Pea Protein, White Wine Vinegar, Dijon Mustard [Water, MUSTARD Seeds (30%), Spirit Vinegar, Salt, Citric Acid], Salt, Granulated Sugar)",
    allergens: ["mustard"],
  },
  {
    name: "Vegan Mayo (Lion)",
    declaration:
      "Vegan Mayo (Rapeseed Oil (65%), Water, Spirit Vinegar, Sugar, Salt, Modified Starch, Stabiliser (Xanthan Gum), Preservative (Potassium Sorbate), Lemon Juice Concentrate, Natural Flavouring, Colour (Turmeric, Paprika Extract))",
    allergens: [],
  },
  {
    name: "Mustard Mayonnaise",
    declaration:
      "Mustard Mayonnaise (Rapeseed Oil (64%), MUSTARD (10%) (Water, Spirit Vinegar, MUSTARD Seeds, Salt, Spice, Caramel Sugar, Natural Flavouring), Pasteurised Liquid EGG (10%), Water, Sugar, Acidity Regulator: Acetic Acid, Salt, Spice (MUSTARD), Stabiliser: Guar Gum, Xanthan Gum, Preservative: Potassium Sorbate)",
    allergens: ["mustard", "eggs"],
  },
  {
    name: "Caesar Dressing",
    declaration:
      "Caesar Dressing (Water, rapeseed oil (25%), spirit vinegar, sugar, skimmed MILK powder, EGG yolk, garlic, CHEESE (MILK), salt, acid (lactic acid), whey protein concentrate (MILK), ANCHOVY (FISH) (0.1%), glucose fructose syrup, lemon juice concentrate, preservative (potassium sorbate))",
    allergens: ["milk", "eggs", "fish"],
  },
  {
    name: "BBQ Sauce",
    declaration:
      "Barbecue Sauce (Water, Sugar, Tomato Paste, Spirit Vinegar, BARLEY Malt Vinegar, SOYA Sauce, Salt, Glucose, Caramelised Sugar Syrup, Flavourings (WHEAT, CELERY), Smoke Flavouring, Garlic Powder, Onion Powder)",
    allergens: [GLUTEN, "soybeans", "celery"],
  },
  {
    name: "BBQ Sauce (smoky)",
    declaration:
      "BBQ Sauce (Water, Sugar, Spirit Vinegar, Concentrated Tomato Puree, Modified Maize Starch, Salt, Smoke Flavouring, Malt Extract (BARLEY), Paprika, Preservative (Potassium Sorbate), Black Pepper)",
    allergens: [GLUTEN],
  },
  {
    name: "Sweet Chilli Sauce",
    declaration:
      "Sweet Chilli Sauce (Water, Sugar (36%), Spirit Vinegar, Garlic, Modified Maize Starch, Salt, Chilli Flakes, Chilli Powder [Cayenne, Paprika, Cumin, Salt, Garlic, Oregano, Rapeseed Oil])",
    allergens: [],
  },
  {
    name: "Sweet Chilli Dressing",
    declaration:
      "Sweet Chilli Sauce (Sugar Syrup, Water, Red Chilli (14%), Garlic (4%), Salt, Thickener (Modified Tapioca Starch), Acidity regulator (Acetic Acid), Preservative (Potassium Sorbate))",
    allergens: [],
  },
  {
    name: "Asian Sweet Chilli Sauce",
    declaration:
      "Asian Sweet Chilli Sauce (Roasted Red Peppers, Sugar, Tomatoes, Vinegar, Red Wine, Ginger, Salt, Rapeseed Oil, Lemongrass, Onion, Gelling Agent (Pectin), Galagal, Lime Leaves, Basil, Coriander, Cumin, Cardamon, Paprika, Acidity Regulator (Citric Acid))",
    allergens: [],
  },
  {
    name: "Satay Sauce",
    declaration:
      "Satay Sauce (Water, Sugar, Coconut Cream (8%) (Coconut Extract, Water), Garlic Purée (8%), Roasted PEANUTS, Roasted PEANUT Paste (5%), Dark Soya Sauce (Water, Salt, Sugar, Molasses, BARLEY Malt Extract, SOYA Bean, Acidity Regulator: Acetic Acid, Fortified WHEAT Flour), Red Miso Paste (SOYA Bean, Sugar, Water, Salt, WHEAT Flour), Red Peppers, Modified Maize Starch, Rapeseed Oil, Acidity Regulators: Citric Acid, Lactic Acid, Yeast Extract (From BARLEY), Chilli Purée, Onion Powder, Garlic Powder, Ground Spice Blend (Coriander, Cumin, Cinnamon, Turmeric, Chilli, Bay Leaf, Ginger, Cayenne Pepper, Cassia, Clove, Black Pepper, Fennel Seed, Fenugreek, Coriander Seed, Cardamom, Nutmeg, Garlic), Salt, Chinese Five Spices (Star Anise, Cinnamon, Fennel Seed, Black Pepper, Clove), Toasted SESAME Oil, Tomato Powder, Colour: Paprika Extract, Dextrose, Rice Flour, Mango Powder, Flavouring, Dried Oregano)",
    allergens: ["peanuts", GLUTEN, "soybeans", "sesame"],
  },
  {
    name: "Tomato & Basil Sauce",
    declaration:
      "Tomato & Basil Sauce (Tomato Puree 39%, Tomato 34%, Water, Onion, Vegetable Oil, Sugar, Basil 1.2%, Garlic Puree, Salt, Modified Maize Starch, Oregano, Sundried Tomato Puree, Citric Acid, Natural Flavourings, Fennel, White Wine Vinegar, Black Pepper, Parsley, Thyme, Bay, Onion Powder, Onion Extract)",
    allergens: [],
  },
  {
    name: "Tomato & Basil Sauce (chunky)",
    declaration:
      "Tomato and Basil Sauce (tomato pulp 90%, mixed vegetables (CELERY, carrots, onion), double tomato concentrate 3%, extra-virgin olive oil, sunflower oil, basil 1%, salt, sugar, pepper)",
    allergens: ["celery"],
  },
  {
    name: "Pizza Tomato & Basil Sauce",
    declaration:
      "Tomato and Basil Sauce (Tomatoes (64%), Tomato Purée (19%), Onion (8%), Rapeseed Oil, Sugar, Basil (1%), Garlic Purée (1%), Salt, Modified Maize Starch, Sundried Tomato Purée (Sunflower Oil, Sundried Tomatoes, Water, White Wine Vinegar, Sugar, Salt), Oregano, Acidity Regulator (Citric Acid), Ground Fennel, Colour (Paprika Extract), Dried Parsley, Ground Black Pepper, Thyme, Ground Bay Leaves, Onion Powder, Flavourings, Onion Extract)",
    allergens: [],
  },
  {
    name: "Arrabbiata Sauce",
    declaration:
      "Arrabbiata Sauce (Tomatoes (72%), Concentrated Tomato Purée (10%), Water, Mixed Peppers (5%), Onions, Sugar, Modified Maize Starch, Salt, Basil, Rapeseed Oil, Garlic Purée, Acidity Regulator (Citric Acid), Chilli Powder, Onion Powder, Paprika, Parsley, Dried Oregano, Black Pepper)",
    allergens: [],
  },
  {
    name: "Cranberry Sauce",
    declaration:
      "Cranberry Sauce (Sugar Syrup, Cranberries (35%), Water, Gelling Agent (E440), Acidity Regulators (E330, E331, E333iii), Preservative (E202))",
    allergens: [],
  },
  {
    name: "Branston Sweet Pickle",
    declaration:
      "Branston Small Chunk Sweet Pickle (Vegetables in Variable Proportions (51%) (Carrot, Rutabaga, Onion, Cauliflower), Sugar, BARLEY Malt Vinegar, Spirit Vinegar, Water, Tomato Purée, Date Paste (Dates, Rice Flour), Apple Pulp, Salt, Modified Maize Starch, Colour (SULPHITE Ammonia Caramel), Onion Powder, Concentrated Lemon Juice, Spices, Colouring Food (Roasted BARLEY Malt Extract), Herb and Spice Extracts)",
    allergens: [GLUTEN, "sulphites"],
  },
  {
    name: "Branston Original Pickle",
    declaration:
      "Branston Original Pickle (Vegetables in Variable Proportions (52%) (Carrot, Rutabaga, Onion, Cauliflower), Sugar, BARLEY Malt Vinegar, Water, Spirit Vinegar, Tomato Purée, Date Paste (Dates, Rice Flour), Salt, Apple Pulp, Modified Maize Starch, Colour (SULPHITE Ammonia Caramel), Onion Powder, Concentrated Lemon Juice, Spices, Colouring Food (Roasted BARLEY Malt Extract), Herb and Spice Extracts)",
    allergens: [GLUTEN, "sulphites"],
  },
  {
    name: "Mango Chutney",
    declaration:
      "Mango Chutney (Mango 63%, white wine vinegar, sugar, spices, salt, garlic, red chilli, ginger root)",
    allergens: [],
  },
  {
    name: "Caramelised Onion Chutney",
    declaration:
      "Caramelised Onion Chutney (Onion (51%), Sugar, Balsamic vinegar (Wine vinegar, Grape must, Colour: SULPHITE ammonia caramel, Preservative: SULPHUR DIOXIDE), Muscovado sugar, Sunflower oil, Spices, Concentrated lemon juice, Garlic powder, Acidity regulator: Citric acid, Salt)",
    allergens: ["sulphites"],
  },
  {
    name: "Onion Chutney (Brakes)",
    declaration:
      "Onion Chutney (Water, Onion (30%), Soft Brown Sugar, Red wine vinegar, Sugar, Apple (Apple, Salt), Rapeseed Oil, Tomato Paste, Dried Onion (1%), Salt, Concentrated Lemon Juice, Preservative (Potassium Sorbate), Onion Powder, Thyme, Colour (Caramel), Cayenne Pepper)",
    allergens: [],
  },
  {
    name: "Real Ale Chutney",
    declaration:
      "Real Ale Chutney (Apple (17%), Water, Apricot (13%), Onion (12%), Sugar and Cane Molasses, Ale (10%) (contains BARLEY), Cider Vinegar, Dried Dates (3%), Sultanas (3%), Molasses, Cornflour, Spices, Yellow MUSTARD Seeds, Preservative: Sorbic Acid)",
    allergens: [GLUTEN, "mustard"],
  },
  {
    name: "Spicy Tomato Chutney",
    declaration:
      "Spicy Tomato Chutney (Tomatoes (45%), Sugar, Onion, Spirit Vinegar, Tomato Puree, Salt, Sunflower oil, Garlic (1.3%), Corn Starch, Fenugreek, Cumin seeds, Fennel seeds, Onion seeds, MUSTARD seeds, Acidity regulator (Citric Acid), Chilli Pepper (0.05%))",
    allergens: ["mustard"],
  },
  {
    name: "Tzatziki",
    declaration:
      "Tzatziki (Yogurt (MILK) (67%), Cucumber (32%), Garlic Powder, Salt, Mint)",
    allergens: ["milk"],
  },
  {
    name: "Green Pesto",
    declaration:
      "Green Pesto (Basil, Extra Virgin Olive Oil, Cheese (cow's and sheep's MILK, salt, rennet), Pine seeds, CASHEW NUTS, Salt, Sugar, WALNUTS, Potato flour, Garlic, Acidity corrector: Lactic acid)",
    allergens: ["milk", "tree-nuts"],
  },
  {
    name: "Red Pesto",
    declaration:
      "Red Pesto (Minced sun-dried tomatoes 43%, Sunflower seed oil, Basil 12%, Extra-virgin olive oil, Pine seeds, CASHEW nuts, Salt, Pecorino Romano DOP (sheep's MILK, Salt, Rennet), Parmigiano Reggiano DOP (MILK, Salt, Rennet), Sugar, WALNUTS, Potato flour, White wine vinegar, Garlic, Acidity correctors: Lactic acid, Antioxidant: Ascorbic Acid)",
    allergens: ["milk", "tree-nuts"],
  },
  {
    name: "Pesto alla Genovese",
    declaration:
      "Pesto alla Genovese (basil in oil 30% (basil 90%, sunflower oil, salt, water), Pecorino Romano DOP cheese (sheep's MILK, salt, rennet), extra-virgin olive oil, sunflower oil, WALNUTS, Grana Padano DOP cheese (MILK, salt, rennet, EGG lysozyme), PINE NUTS, garlic)",
    allergens: ["milk", "tree-nuts", "eggs"],
  },
  {
    name: "Hollandaise Sauce",
    declaration:
      "Hollandaise Sauce (Sunflower Oil, Water, Butter (7%) (Contains MILK), Sugar, White Grape Vinegar, Free Range Pasteurised EGG Yolk (4%) (EGG Yolk, Salt), Concentrated Lemon Juice (1.5%), Salt, Modified Starch, Dijon MUSTARD (Water, MUSTARD Seeds, White Vinegar, Salt), Natural Colour: Beta Carotene Oil, Stabiliser: Xanthan Gum, Preservative: Potassium Sorbate)",
    allergens: ["milk", "eggs", "mustard"],
  },
  {
    name: "Chipotle Sauce",
    declaration:
      "Chipotle Sauce (Mayonnaise (rapeseed oil, water, spirit vinegar, EGG yolk powder, sugar, salt, modified starch, stabilisers [guar gum, xanthan gum], MUSTARD powder), Chipotle Chillies [Smoked Jalapenos In Adobo Sauce] (31%) (chipotle peppers, water, tomato paste, salt, sugar, onion, acid [acetic acid]), Sour Cream Powder (MILK), Spirit Vinegar, Salt, Acidity Regulator (Lactic Acid), Preservative (Potassium Sorbate), Stabilisers (Guar Gum, Xanthan Gum))",
    allergens: ["eggs", "mustard", "milk"],
  },
  {
    name: "Piri-Piri Seasoning",
    declaration:
      "Piri-Piri Seasoning (Chilli, Garlic, Onion, Black Pepper, Salt, Basil, Oregano, Coriander, Bay leaves, Olive Oil)",
    allergens: [],
  },
  {
    name: "Baked Beans",
    declaration:
      "Baked Beans (Beans (51%), Tomatoes (31%), Water, Sugar, Modified Cornflour, Spirit Vinegar, Salt, Cornflour, Antioxidant - Ascorbic Acid, Spice Extracts, Herb Extract)",
    allergens: [],
  },
  { name: "Tomato Ketchup", declaration: null, allergens: [] },
  {
    name: "Dijon Mustard",
    declaration:
      "Dijon Mustard (Water, MUSTARD Seeds, spirit vinegar, salt, acid (citric acid), preservative - POTASSIUM METABISULPHITE (SULPHITES))",
    allergens: ["mustard", "sulphites"],
  },
  {
    name: "Wholegrain Mustard",
    declaration:
      "Mustard (Water, MUSTARD Seeds 19%, Spirit Vinegar, Salt, Sugar, Spices)",
    allergens: ["mustard"],
  },
  {
    name: "English Mustard",
    declaration:
      "English Mustard (Water, MUSTARD (MUSTARD flour (15%) (SULPHITES), MUSTARD bran (3%)), Sugar (SULPHITES), Salt, WHEAT flour (WHEAT flour, Calcium Carbonate, Calcium Sulphate, Iron, Thiamine, Nicotinamide), Acid (Citric acid, Ascorbic acid), Rapeseed oil, Ground turmeric, Stabiliser (Xanthan Gum), Preservative (Potassium sorbate))",
    allergens: ["mustard", "sulphites", GLUTEN],
  },
  {
    name: "Sunflower Spread",
    declaration:
      "Sunflower Spread (Water, Sunflower Oil (41%), Palm Oil, Salt (1.4%), Preservative (Potassium Sorbate), Emulsifier (Mono and Di-Glycerides), Citric Acid, Flavouring, Carotenes, Vitamin A, Vitamin D)",
    allergens: [],
  },
  { name: "Low Fat Spread", declaration: null, allergens: [] },
  {
    name: "Vegetable Spread",
    declaration:
      "Vegetable Spread (Rapeseed Oil, RSPO Palm Oil, Water, Salt, Emulsifier E471, Preservative: E202, Colours E160b(i), E100, Acidity Regulator E330, Flavouring)",
    allergens: [],
  },
  { name: "Curry Powder", declaration: null, allergens: [] },
  { name: "Raisins", declaration: null, allergens: [] },
  {
    name: "Hummus",
    declaration:
      "Hummus (Chick Peas (56%), Rapeseed Oil, Water, Tahini (SESAME Seeds), Salt, Citric Acid, Garlic Powder (Contains Naturally Occurring SULPHITES, Anti Caking Agent (E470a)), Potassium Sorbate)",
    allergens: ["sesame", "sulphites"],
  },
  {
    name: "Red Pepper & Jalapeno Hummus",
    declaration:
      "Red Pepper and Jalapeno Hummus (Chick Peas (56%), Grilled Red Peppers (18.5%), Tahini (SESAME Seeds), Rapeseed Oil, Water, Jalapeno Peppers (1%), Salt (Salt, Anti Caking Agent (E535)), Citric Acid, Garlic Powder (Contains Naturally Occurring SULPHITES, Anti Caking Agent (E470a)), Potassium Sorbate)",
    allergens: ["sesame", "sulphites"],
  },
  {
    name: "Moroccan Falafel",
    declaration:
      "Moroccan Falafel (Tomato paste (65%) (Tomato, salt), Falafel (22.5%) (Chick peas, broad beans, onions, vegetable oil (SOYA bean oil, anti-foaming agent E900), spices (cinnamon, cumin, coriander, chilli powder), parsley, SESAME seeds, salt, emulsifier (mono and di-glycerides of fatty acids), antioxidants (ascorbic acid, sodium metabisulphite (SULPHITES)), flavouring), Moroccan sprinkle (5%) (Spices (cumin, ginger, coriander, paprika, pepper, cinnamon, chilli, clove), sugar, dextrose, garlic, salt, lemon peel, herbs (mint)), Mango chutney (5%) (Sugar, mango slices, sugarcane vinegar, salt, chilli powder, ginger powder, garlic powder), Mixed peppers (2.5%))",
    allergens: ["soybeans", "sesame", "sulphites"],
  },
  {
    name: "Falafel",
    declaration:
      "Falafel (Chick Peas (53%), Onion (32%), WHEAT Flour, Rapeseed Oil, Cumin, Garlic Puree, Salt, Ground Coriander, Coriander Leaf, Chilli Powder, Concentrated Lemon Juice, Thickener (Methylcellulose), Black Pepper, Turmeric)",
    allergens: [GLUTEN],
  },
  {
    name: "Beetroot Falafel",
    declaration:
      "Beetroot Falafel with Red Pepper & Chilli (Beetroot (31%), Chickpeas (31%), Red Pepper, Potato Flake, Onion, Rapeseed Oil, Garlic Puree (water, Garlic Granules), Ground Coriander, Ground Cumin, Lemon Juice from Concentrate, Paprika, Salt, Chilli Flakes)",
    allergens: [],
  },
  {
    name: "Onion Bhaji",
    declaration:
      "Onion Bhaji (Onion (75%) (White and Red Onion), Gram Flour (Chickpeas, Yellow Split Peas), WHEAT Flour (WHEAT Flour, Calcium Carbonate, Iron, Niacin, Thiamin), Rapeseed Oil, Rice Flour, Cumin, Salt, Garlic, Paprika, Fenugreek, Cayenne, Turmeric, Coriander Leaf, Raising Agent (Ammonium Carbonate), Garlic Powder, Acidity Regulator (Citric Acid), Oregano)",
    allergens: [GLUTEN],
  },
  { name: "Avocado", declaration: "Hass Avocado (100%)", allergens: [] },
  {
    name: "Roasted Red Peppers in Brine",
    declaration:
      "Roasted Red Peppers in Brine (Red Peppers, Water, Vinegar, Salt, Sugar)",
    allergens: [],
  },

  // ---------- Salad & vegetables ----------
  { name: "Lettuce", declaration: null, allergens: [] },
  { name: "Iceberg Lettuce", declaration: null, allergens: [] },
  { name: "Mixed Salad Leaf", declaration: null, allergens: [] },
  { name: "Baby Spinach", declaration: null, allergens: [] },
  { name: "Rocket", declaration: null, allergens: [] },
  { name: "Cress", declaration: null, allergens: [] },
  { name: "Cucumber", declaration: null, allergens: [] },
  { name: "Tomatoes", declaration: null, allergens: [] },
  { name: "Cherry Tomatoes", declaration: null, allergens: [] },
  {
    name: "Sundried Tomatoes",
    declaration:
      "Sundried Tomatoes in Oil (Sundried Tomatoes, Sunflower Oils, Vinegar, Salt, Spice Mix, Flavours, Citric Acid, Ascorbic Acid)",
    allergens: [],
  },
  { name: "Red Onion", declaration: null, allergens: [] },
  { name: "Spring Onions", declaration: null, allergens: [] },
  { name: "Mixed Peppers", declaration: null, allergens: [] },
  { name: "Diced Red Peppers", declaration: null, allergens: [] },
  { name: "Sweetcorn", declaration: null, allergens: [] },
  { name: "Gherkins", declaration: "Gherkins, pickled", allergens: [] },
  {
    name: "Coleslaw",
    declaration:
      "Coleslaw (Cabbage 45%, Mayonnaise 30% (Rapeseed Oil, Water, Liquid Sugar (Sucrose, Water), Spirit Vinegar, Salt, Pasteurised Whole EGG, Stabilisers (Guar Gum, Xanthan Gum), MUSTARD Flour, Lactic Acid), Carrot 10%, Onion 1%, Single Cream (MILK), Spirit Vinegar, Preservative (Potassium Sorbate))",
    allergens: ["eggs", "mustard", "milk"],
  },
  {
    name: "Black Olives",
    declaration:
      "Pitted Black Olives (Pitted Black Olives, Water, Salt, Stabiliser (Ferrous Gluconate))",
    allergens: [],
  },
  { name: "Carrot", declaration: null, allergens: [] },
  { name: "Red Cabbage", declaration: null, allergens: [] },
  { name: "Savoy Cabbage", declaration: null, allergens: [] },
  { name: "Mooli Radish", declaration: null, allergens: [] },
  {
    name: "Pickled Red Cabbage",
    declaration:
      "Pickled Red Cabbage (Red Cabbage, Water, Acidity Regulator: Acetic Acid, Spirit Vinegar, Salt, Flavouring)",
    allergens: [],
  },
  { name: "Salt & Black Pepper", declaration: "Salt, Black Pepper", allergens: [] },

  // ---------- Product Details catalogue additions (v2 import) ----------
  { name: "Fresh Basil", declaration: null, allergens: [] },
  {
    name: "White Pasta",
    declaration: "Pasta (Durum WHEAT Semolina, Water)",
    allergens: [GLUTEN],
  },
  {
    name: "Grated Cheddar",
    declaration: "Grated Cheddar Cheese (MILK)",
    allergens: ["milk"],
  },
  { name: "New Potatoes", declaration: null, allergens: [] },
  {
    name: "Cider Honey & Mustard Dressing",
    declaration:
      "Cider Honey & Mustard Dressing (Rapeseed Oil, Cider Vinegar (SULPHITES), Honey, Wholegrain MUSTARD (Water, MUSTARD Seeds, Spirit Vinegar, Salt), Salt, Black Pepper)",
    allergens: ["mustard", "sulphites"],
  },
  {
    name: "Pesto Basil Paste",
    declaration:
      "Pesto Basil Paste (Basil, Sunflower Oil, Pecorino Romano Cheese (MILK), Salt, Water)",
    allergens: ["milk"],
  },
  { name: "Sliced Mushrooms", declaration: null, allergens: [] },
  { name: "White Onion", declaration: null, allergens: [] },
  {
    name: "Fajita Seasoning",
    declaration:
      "Fajita Seasoning (Spices, Salt, Garlic Powder, Onion Powder, MUSTARD Flour, Paprika, Oregano)",
    allergens: ["mustard"],
  },
  { name: "Honey", declaration: null, allergens: [] },
  {
    name: "Jerk Peri Peri Sauce",
    declaration:
      "Jerk Peri Peri Sauce (Water, Spirit Vinegar (SULPHITES), Tomato Paste, Chilli, Onion, Garlic, Spices, Salt, Rapeseed Oil, Thickener (Xanthan Gum))",
    allergens: ["sulphites"],
  },
  {
    name: "Bechamel Sauce",
    declaration:
      "Bechamel Sauce (Water, MILK Powder, Modified Starch, Butter (MILK), Salt, Nutmeg)",
    allergens: ["milk"],
  },
  {
    name: "Multigrain Baguette",
    declaration:
      "Multigrain Baguette (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Malted WHEAT Flakes, Yeast, Salt, SESAME Seeds, Linseed, Millet, Sunflower Seeds, Malted BARLEY Flour)",
    allergens: [GLUTEN, "sesame"],
  },
  {
    name: "Golden Breadcrumbs",
    declaration: "Golden Breadcrumbs (WHEAT Flour, Water, Salt, Yeast)",
    allergens: [GLUTEN],
  },
  { name: "Semi Skimmed Milk", declaration: "Semi Skimmed MILK", allergens: ["milk"] },
  { name: "Celery Batons", declaration: "CELERY Batons", allergens: ["celery"] },
  {
    name: "Sage & Onion Breadcrumb Coating",
    declaration:
      "Sage & Onion Breadcrumb Coating (WHEAT Flour, Onion, Sage, Salt, Yeast, Spices)",
    allergens: [GLUTEN],
  },
  { name: "Strawberries", declaration: null, allergens: [] },
  { name: "Pineapple", declaration: null, allergens: [] },
  { name: "Grapes", declaration: null, allergens: [] },
  { name: "Melon", declaration: null, allergens: [] },
  {
    name: "Greek Yogurt",
    declaration: "Greek Style Yogurt (MILK)",
    allergens: ["milk"],
  },
  {
    name: "Granola",
    declaration:
      "Granola (Oat Flakes (GLUTEN), Honey, Sunflower Oil, ALMONDS, Raisins, Sunflower Seeds)",
    allergens: [GLUTEN, "tree-nuts"],
  },
  {
    name: "Lemon Curd",
    declaration:
      "Lemon Curd (Sugar, Water, Butter (MILK), Pasteurised EGG, Lemon Juice, Modified Starch, Gelling Agent (Pectin), Citric Acid, Flavouring, Colour (Carotenes))",
    allergens: ["milk", "eggs"],
  },
  {
    name: "Strawberry Compote",
    declaration:
      "Strawberry Compote (Strawberries, Sugar, Lemon Juice, Gelling Agent (Pectin))",
    allergens: [],
  },
  {
    name: "Indian Snacks Selection",
    declaration:
      "Indian Snacks Selection (Onion Bhaji (Onion, Gram Flour, Rapeseed Oil, Spices), Vegetable Samosa (Potato, Peas, WHEAT Flour, Rapeseed Oil, Spices), Vegetable Pakora (Mixed Vegetables, Gram Flour, Spices, Rapeseed Oil))",
    allergens: [GLUTEN],
  },
  { name: "Noodles", declaration: "Noodles (WHEAT Flour, Water, Salt)", allergens: [GLUTEN] },
  {
    name: "Coleslaw (fresh)",
    declaration:
      "Coleslaw (Mayonnaise [Water, Rapeseed Oil, Spirit Vinegar, Sugar, EGG, Salt, MUSTARD Flour, Stabilisers (Guar Gum, Xanthan Gum)], Cabbage (42%), Carrot (8%), Onion (2%))",
    allergens: ["eggs", "mustard"],
  },
  {
    name: "White Chocolate & Cranberry Cookie Mix",
    declaration:
      "White Chocolate & Cranberry Cookie (WHEAT Flour, Butter (MILK), Sugar, White Chocolate (Sugar, Cocoa Butter, Whole MILK Powder), Cranberries, EGG)",
    allergens: [GLUTEN, "milk", "eggs"],
  },
  { name: "Sweet Potato", declaration: null, allergens: [] },
  {
    name: "Tomato & Chilli Sauce",
    declaration:
      "Tomato & Chilli Sauce (Tomatoes, Onion, Red Chilli, Garlic, Rapeseed Oil, Sugar, Salt, Herbs)",
    allergens: [],
  },
  {
    name: "BBQ Jackfruit",
    declaration:
      "BBQ Jackfruit (Jackfruit, BBQ Sauce (Water, Sugar, Tomato Paste, Spirit Vinegar, Salt, Spices, Smoke Flavouring))",
    allergens: [],
  },
  { name: "Butternut Squash", declaration: null, allergens: [] },
  {
    name: "Vegetable Bouillon",
    declaration:
      "Vegetable Bouillon (Salt, Potato Starch, Vegetable Fat, Sugar, Vegetables (Onion, Carrot, Leek), Yeast Extract, Herbs, Spices)",
    allergens: [],
  },
  { name: "Butter", declaration: "Butter (MILK)", allergens: ["milk"] },
  { name: "Fresh Coriander", declaration: null, allergens: [] },
  {
    name: "Chilli Con Carne",
    declaration:
      "Chilli Con Carne (Beef, Tomatoes, Kidney Beans, Onion, Water, Tomato Puree, Spices, Garlic, Salt, Rapeseed Oil)",
    allergens: [],
  },
  { name: "Baked Jacket Potato", declaration: null, allergens: [] },
  { name: "Leeks", declaration: null, allergens: [] },
  {
    name: "Cumberland Sausage (butcher's)",
    declaration:
      "Cumberland Sausage (Pork, Water, Rusk (WHEAT), Salt, Spices, Herbs, Preservative (Sodium METABISULPHITE), Dextrose, Stabiliser (Diphosphates), MUSTARD, MILK Powder)",
    allergens: [GLUTEN, "milk", "mustard", "sulphites"],
  },
  {
    name: "Malted Wheat Roll",
    declaration:
      "Malted Wheat Roll (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Malted WHEAT Flakes, Yeast, Salt, Malted BARLEY Flour, RYE Flour, Vegetable Oil (Rapeseed), Flour Treatment Agent (Ascorbic Acid))",
    allergens: [GLUTEN],
  },
  {
    name: "Granary Bap",
    declaration:
      "Granary Bap (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Malted WHEAT Flakes, Yeast, Roll Improver [Salt, WHEAT Flour, SOYA Flour, Rapeseed Oil, Calcium Sulphate, Flour Treatment Agent (Ascorbic Acid, L-Cysteine Hydrochloride)], Malted BARLEY Flour)",
    allergens: [GLUTEN, "soybeans"],
  },
  {
    name: "Wafer Thin Ham",
    declaration:
      "Wafer Thin Ham (Pork (85%), Water, Salt, Antioxidant (Sodium Ascorbate E301), Preservatives (Sodium Nitrite E250, Potassium Nitrate E252))",
    allergens: [],
  },
  {
    name: "Sourdough Bap",
    declaration:
      "Sourdough Bap (WHEAT Flour (with Calcium, Iron, Niacin, Thiamin), Water, Fermented WHEAT Flour, Salt, Yeast)",
    allergens: [GLUTEN],
  },
  {
    name: "BBQ Pulled Pork",
    declaration:
      "BBQ Pulled Pork (Pork Belly (39%), Pork Shoulder (32%), Pork Stock, Water, Tomato Puree, Red Wine Vinegar, White Wine Vinegar, Dark Soft Brown Sugar, Light Soft Brown Sugar, Honey, Onions, Caster Sugar, Tamari (SOYA), Black Treacle, Salt, Lemon Juice, Smoked Paprika, Garlic, Rapeseed Oil, Chilli Flakes, Xanthan Gum, Cloves, Nutmeg, Brine Spice Mix)",
    allergens: ["soybeans"],
  },
];
