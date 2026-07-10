// Backfill per-100g nutrition for imported component ingredients with typical
// UK food-composition values, so recipes the user builds from the ingredient
// picker calculate live nutrition. Conservative: an ingredient is only updated
// while its panel is still all-zero (i.e. never entered by anyone), so
// hand-entered data always wins. Idempotent — a second run finds nothing to do.
// Run with: npm run db:backfill-nutrition
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { ingredients } from "./schema";

// [kcal, kJ, fat, saturates, carbohydrate, sugars, fibre, protein, salt]
type Panel = [number, number, number, number, number, number, number, number, number];

const TYPICAL: Record<string, Panel> = {
  // ---------- Breads & bakery ----------
  "White Bread": [265, 1120, 3.2, 0.7, 49, 3.8, 2.7, 8.9, 1.0],
  "Medium Sliced White Bread": [265, 1120, 3.2, 0.7, 49, 3.8, 2.7, 8.9, 1.0],
  "Soft White Bread": [260, 1100, 3.0, 0.6, 48, 4.0, 2.5, 8.5, 0.95],
  "White Bloomer": [250, 1060, 1.5, 0.3, 50, 2.5, 2.5, 9.0, 1.0],
  "Strong White Bloomer": [245, 1040, 1.2, 0.3, 49, 2.0, 2.6, 9.5, 1.0],
  "Malted Bloomer": [250, 1060, 2.0, 0.4, 47, 3.5, 4.0, 10, 0.9],
  "Malted Sandwich Bread": [240, 1020, 2.0, 0.4, 45, 3.0, 4.5, 10, 0.9],
  "Wholemeal Bread": [220, 935, 2.5, 0.5, 38, 2.8, 6.5, 10, 0.9],
  "White Roll": [270, 1145, 3.5, 0.8, 50, 3.5, 2.5, 9.0, 1.1],
  "Granary Roll": [255, 1080, 2.5, 0.5, 47, 3.0, 4.5, 10, 1.0],
  "Malted Wheat Roll": [255, 1080, 2.3, 0.5, 47, 3.2, 4.3, 10, 1.0],
  "Granary Bap": [255, 1080, 2.5, 0.5, 47, 3.0, 4.5, 10, 1.0],
  "Sourdough Bap": [240, 1020, 1.0, 0.2, 48, 1.5, 2.5, 9.0, 1.1],
  "Gluten Free White Bread": [235, 990, 4.5, 0.6, 42, 3.0, 7.0, 4.5, 1.0],
  "Brioche Bun": [330, 1390, 9.0, 4.5, 52, 12, 2.5, 9.0, 0.9],
  "All Butter Croissant": [400, 1670, 23, 14, 38, 8.0, 2.5, 8.0, 0.9],
  "English Muffin": [225, 955, 1.8, 0.3, 42, 3.5, 2.5, 10, 0.9],
  "Ciabatta Roll": [270, 1145, 3.5, 0.6, 50, 1.5, 3.0, 10, 1.2],
  "Panini": [275, 1165, 3.0, 0.5, 52, 2.5, 2.8, 10, 1.2],
  "White Baguette": [275, 1165, 1.5, 0.3, 55, 2.5, 2.8, 10, 1.2],
  "Multigrain Baguette": [265, 1120, 3.5, 0.5, 48, 3.0, 5.0, 10, 1.1],
  "Plain Bagel": [275, 1165, 1.5, 0.3, 53, 6.0, 2.5, 10, 0.9],
  "Tortilla Wrap": [310, 1310, 7.5, 3.5, 52, 3.0, 2.5, 8.5, 1.1],
  "Golden Breadcrumbs": [355, 1500, 2.0, 0.4, 72, 4.0, 4.0, 11, 1.2],
  "Sage & Onion Breadcrumb Coating": [330, 1395, 3.0, 0.6, 65, 5.0, 5.0, 11, 2.0],

  // ---------- Cheese & dairy ----------
  "Mature Cheddar": [416, 1725, 35, 22, 0.1, 0.1, 0, 25, 1.8],
  "Sliced Mild Cheddar": [410, 1700, 34, 21, 0.5, 0.5, 0, 25, 1.7],
  "Grated Cheddar": [410, 1700, 34, 21, 0.5, 0.5, 0, 25, 1.7],
  "Red Leicester": [400, 1660, 33, 21, 0.5, 0.5, 0, 24, 1.7],
  "Grated Mozzarella & Cheddar": [350, 1450, 27, 17, 1.5, 1.0, 0, 25, 1.5],
  "Mozzarella": [280, 1160, 21, 14, 2.0, 1.0, 0, 20, 0.5],
  "Brie": [340, 1410, 29, 18, 0.5, 0.5, 0, 20, 1.5],
  "Feta": [270, 1120, 22, 15, 1.5, 1.5, 0, 17, 2.6],
  "Emmental": [380, 1580, 29, 19, 0.5, 0.5, 0, 29, 0.7],
  "Blue Stilton": [410, 1700, 35, 23, 0.1, 0.1, 0, 23, 2.0],
  "Cream Cheese": [240, 995, 23, 15, 4.0, 4.0, 0, 5.5, 0.75],
  "Greek Yogurt": [130, 540, 10, 6.8, 4.0, 4.0, 0, 4.5, 0.15],
  "Semi Skimmed Milk": [50, 210, 1.8, 1.1, 4.8, 4.8, 0, 3.6, 0.1],
  "Butter": [740, 3040, 82, 52, 0.6, 0.6, 0, 0.6, 1.2],
  "Vegan Cheddar Slices": [285, 1180, 23, 21, 17, 0, 2.0, 1.0, 2.0],
  "Vegan Slice (Kerrymaid)": [285, 1180, 23, 21, 17, 0, 2.0, 1.0, 2.0],
  "Low Fat Spread": [365, 1500, 40, 9.0, 1.0, 0.5, 0, 0.2, 0.9],
  "Sunflower Spread": [530, 2180, 59, 13, 1.0, 0.5, 0, 0.2, 1.1],
  "Vegetable Spread": [530, 2180, 59, 14, 1.0, 0.5, 0, 0.2, 1.1],

  // ---------- Meat & poultry ----------
  "Chicken Breast": [150, 630, 3.0, 0.9, 0, 0, 0, 30, 0.6],
  "Southern Fried Chicken": [230, 965, 11, 1.8, 14, 1.0, 0.8, 19, 1.1],
  "Coronation Chicken": [220, 915, 15, 2.0, 8.0, 7.0, 0.8, 14, 0.7],
  "Pork Gyros": [230, 960, 15, 5.0, 3.0, 1.0, 0.5, 20, 1.5],
  "Streaky Bacon": [340, 1410, 30, 11, 0, 0, 0, 17, 2.3],
  "Smoked Streaky Bacon": [340, 1410, 30, 11, 0, 0, 0, 17, 2.4],
  "Cooked Back Bacon": [215, 900, 12, 4.5, 0.5, 0.5, 0, 26, 2.6],
  "Sliced Cooked Ham": [110, 460, 3.0, 1.0, 1.5, 1.0, 0, 20, 1.9],
  "Wiltshire Ham": [130, 545, 5.0, 1.7, 1.0, 0.8, 0, 21, 1.9],
  "Wafer Thin Ham": [105, 440, 2.5, 0.8, 1.5, 1.0, 0, 19, 1.8],
  "Gammon Ham": [130, 545, 5.0, 1.7, 1.0, 0.8, 0, 21, 2.1],
  "Pastrami": [115, 485, 3.0, 1.2, 1.0, 1.0, 0, 20, 1.8],
  "Sliced Roast Beef": [135, 565, 4.0, 1.5, 0.5, 0.5, 0, 24, 0.8],
  "Pepperoni": [500, 2070, 44, 17, 1.5, 1.0, 0, 22, 3.5],
  "Chorizo": [455, 1880, 38, 15, 2.0, 1.5, 0, 24, 3.2],
  "Cumberland Sausage": [290, 1205, 23, 8.5, 8.0, 1.0, 1.0, 13, 1.9],
  "Cumberland Sausage (butcher's)": [290, 1205, 23, 8.5, 8.0, 1.0, 1.0, 13, 1.9],
  "Swedish Meatballs": [260, 1080, 19, 7.5, 7.0, 1.5, 1.0, 14, 1.6],
  "BBQ Pulled Pork": [200, 840, 8.0, 2.8, 12, 11, 0.5, 19, 1.2],
  "Chilli Con Carne": [120, 505, 4.5, 1.8, 9.0, 3.0, 2.5, 10, 0.7],
  "Vegan Ham": [130, 545, 2.0, 0.3, 12, 1.0, 4.0, 15, 1.9],

  // ---------- Fish & seafood ----------
  "Tuna": [110, 465, 0.5, 0.2, 0, 0, 0, 26, 0.9],
  "Tuna Mayonnaise": [220, 915, 16, 1.8, 1.5, 1.0, 0, 17, 0.8],
  "Smoked Salmon": [180, 750, 9.0, 1.7, 0.5, 0.5, 0, 23, 3.0],
  "Fresh Salmon Fillet": [200, 835, 13, 2.5, 0, 0, 0, 20, 0.1],
  "Prawns": [80, 340, 0.8, 0.2, 0.5, 0, 0, 17, 1.1],

  // ---------- Eggs ----------
  "Free Range Eggs": [130, 545, 9.0, 2.5, 0.5, 0.5, 0, 13, 0.35],
  "Hardboiled Egg": [145, 600, 10, 2.8, 0.5, 0.5, 0, 13, 0.35],
  "Omelette": [170, 705, 13, 3.5, 0.5, 0.5, 0, 12, 0.9],

  // ---------- Sauces, dressings & condiments ----------
  "Mayonnaise (egg powder recipe)": [720, 2960, 79, 6.0, 1.5, 1.5, 0, 1.0, 1.5],
  "Mustard Mayonnaise": [680, 2800, 74, 5.7, 2.5, 2.0, 0, 1.2, 1.6],
  "Vegan Mayonnaise": [610, 2510, 66, 5.0, 3.0, 2.5, 0, 0.5, 1.4],
  "Vegan Mayo (Lion)": [610, 2510, 66, 5.0, 3.0, 2.5, 0, 0.5, 1.4],
  "Tomato Ketchup": [100, 425, 0.1, 0, 23, 22, 0.5, 1.2, 1.7],
  "BBQ Sauce": [145, 615, 0.3, 0.1, 34, 30, 0.5, 1.0, 1.9],
  "BBQ Sauce (smoky)": [150, 635, 0.3, 0.1, 35, 31, 0.5, 1.0, 2.0],
  "Sweet Chilli Sauce": [230, 975, 0.2, 0, 55, 52, 0.5, 0.5, 1.6],
  "Asian Sweet Chilli Sauce": [230, 975, 0.2, 0, 55, 52, 0.5, 0.5, 1.6],
  "Sweet Chilli Dressing": [200, 850, 3.0, 0.3, 42, 38, 0.5, 0.5, 1.5],
  "Caesar Dressing": [460, 1900, 47, 4.5, 4.5, 3.0, 0.2, 2.5, 1.5],
  "Hollandaise Sauce": [480, 1975, 52, 6.5, 3.0, 2.0, 0.1, 1.5, 1.1],
  "Dijon Mustard": [160, 665, 11, 0.7, 6.5, 3.0, 2.5, 7.5, 5.5],
  "English Mustard": [175, 730, 9.0, 0.6, 14, 8.0, 2.0, 7.0, 6.0],
  "Wholegrain Mustard": [160, 665, 10, 0.6, 8.0, 4.0, 4.0, 8.0, 4.5],
  "Green Pesto": [450, 1860, 44, 6.5, 6.0, 2.5, 2.0, 5.0, 2.0],
  "Red Pesto": [400, 1660, 38, 5.5, 8.0, 5.0, 2.5, 4.5, 2.2],
  "Pesto alla Genovese": [460, 1900, 45, 7.0, 6.0, 2.5, 2.0, 5.5, 2.0],
  "Pesto Basil Paste": [420, 1740, 42, 6.0, 4.5, 2.0, 2.0, 4.5, 2.3],
  "Satay Sauce": [340, 1410, 26, 7.0, 15, 10, 3.0, 11, 1.5],
  "Cranberry Sauce": [160, 680, 0.1, 0, 40, 38, 1.0, 0.2, 0.05],
  "Caramelised Onion Chutney": [180, 765, 0.3, 0.1, 43, 40, 1.5, 0.8, 0.6],
  "Onion Chutney (Brakes)": [180, 765, 0.3, 0.1, 43, 40, 1.5, 0.8, 0.6],
  "Real Ale Chutney": [175, 745, 0.3, 0.1, 42, 38, 1.5, 0.9, 0.7],
  "Spicy Tomato Chutney": [130, 555, 0.5, 0.1, 30, 27, 1.5, 1.2, 1.3],
  "Mango Chutney": [230, 980, 0.3, 0.1, 55, 52, 1.0, 0.4, 1.0],
  "Branston Original Pickle": [100, 425, 0.1, 0, 23, 18, 1.5, 0.7, 1.4],
  "Branston Sweet Pickle": [105, 445, 0.1, 0, 24, 20, 1.5, 0.7, 1.3],
  "Chipotle Sauce": [200, 835, 17, 1.5, 10, 8.0, 1.0, 1.0, 2.0],
  "Jerk Peri Peri Sauce": [80, 340, 4.0, 0.5, 9.0, 7.0, 1.0, 1.2, 2.5],
  "Piri-Piri Seasoning": [250, 1050, 5.0, 0.8, 35, 10, 15, 10, 20],
  "Fajita Seasoning": [290, 1220, 6.0, 1.0, 45, 15, 12, 10, 15],
  "Curry Powder": [325, 1360, 14, 1.5, 30, 3.0, 25, 13, 0.2],
  "Cider Honey & Mustard Dressing": [330, 1370, 28, 2.5, 18, 17, 0.5, 1.5, 1.5],
  "Vegetable Bouillon": [175, 740, 4.0, 2.0, 25, 15, 2.0, 10, 40],
  "Bechamel Sauce": [90, 375, 5.0, 3.0, 8.0, 4.0, 0.2, 3.5, 0.8],
  "Hummus": [300, 1245, 25, 3.0, 10, 1.0, 6.0, 7.5, 1.2],
  "Red Pepper & Jalapeno Hummus": [280, 1165, 23, 2.8, 11, 2.0, 5.5, 7.0, 1.3],
  "Tzatziki": [120, 500, 9.5, 6.0, 4.5, 3.5, 0.5, 4.5, 0.8],
  "Tomato & Basil Sauce": [60, 255, 2.5, 0.4, 7.5, 6.0, 1.2, 1.5, 0.7],
  "Tomato & Basil Sauce (chunky)": [60, 255, 2.5, 0.4, 7.5, 6.0, 1.2, 1.5, 0.7],
  "Pizza Tomato & Basil Sauce": [70, 295, 3.0, 0.5, 8.5, 7.0, 1.3, 1.7, 0.9],
  "Arrabbiata Sauce": [65, 275, 2.8, 0.4, 8.0, 6.5, 1.3, 1.6, 0.8],
  "Tomato & Chilli Sauce": [70, 295, 2.5, 0.4, 9.5, 8.0, 1.3, 1.6, 0.9],
  "Honey": [335, 1425, 0, 0, 83, 82, 0, 0.3, 0.02],
  "Lemon Curd": [285, 1200, 7.5, 4.0, 54, 48, 0.1, 1.5, 0.2],
  "Strawberry Compote": [120, 510, 0.1, 0, 29, 27, 1.0, 0.4, 0.02],

  // ---------- Salad, vegetables & fruit ----------
  "Avocado": [190, 795, 19.5, 4.1, 1.9, 0.5, 3.4, 1.9, 0.02],
  "Baby Spinach": [25, 105, 0.8, 0.1, 1.6, 1.5, 2.2, 2.8, 0.15],
  "Lettuce": [15, 65, 0.3, 0, 1.7, 1.5, 1.2, 0.8, 0.01],
  "Iceberg Lettuce": [14, 60, 0.1, 0, 2.0, 1.8, 1.2, 0.7, 0.01],
  "Mixed Salad Leaf": [18, 75, 0.4, 0.1, 1.8, 1.6, 1.5, 1.2, 0.05],
  "Rocket": [25, 105, 0.7, 0.1, 2.1, 2.0, 1.6, 2.6, 0.07],
  "Cress": [30, 125, 0.7, 0.1, 2.5, 2.0, 1.5, 2.5, 0.05],
  "Cucumber": [15, 65, 0.1, 0, 1.5, 1.4, 0.7, 0.7, 0.01],
  "Tomatoes": [18, 75, 0.2, 0, 3.1, 2.8, 1.2, 0.9, 0.01],
  "Cherry Tomatoes": [20, 85, 0.3, 0.1, 3.5, 3.2, 1.2, 0.9, 0.01],
  "Red Onion": [38, 160, 0.1, 0, 7.9, 5.7, 1.7, 1.1, 0.01],
  "White Onion": [38, 160, 0.1, 0, 7.9, 5.7, 1.7, 1.1, 0.01],
  "Spring Onions": [32, 135, 0.5, 0.1, 5.5, 3.9, 2.2, 2.0, 0.02],
  "Mixed Peppers": [30, 125, 0.3, 0.1, 5.3, 4.9, 1.7, 1.0, 0.01],
  "Diced Red Peppers": [32, 135, 0.4, 0.1, 6.0, 5.5, 1.6, 1.0, 0.01],
  "Roasted Red Peppers in Brine": [40, 170, 0.5, 0.1, 7.5, 6.5, 1.8, 1.2, 1.0],
  "Sweetcorn": [85, 360, 1.4, 0.2, 15, 6.5, 2.5, 3.0, 0.2],
  "Gherkins": [25, 105, 0.2, 0, 4.0, 3.0, 1.2, 0.9, 1.5],
  "Black Olives": [145, 600, 14, 2.3, 1.0, 0, 3.0, 1.0, 3.0],
  "Carrot": [35, 150, 0.3, 0.1, 7.5, 7.0, 2.8, 0.6, 0.07],
  "Red Cabbage": [30, 125, 0.2, 0, 6.5, 5.5, 2.5, 1.4, 0.02],
  "Savoy Cabbage": [27, 115, 0.3, 0.1, 4.5, 3.5, 2.9, 2.0, 0.02],
  "Pickled Red Cabbage": [25, 105, 0.1, 0, 5.0, 4.5, 2.3, 1.0, 0.9],
  "Mooli Radish": [18, 75, 0.1, 0, 3.5, 2.5, 1.5, 0.7, 0.05],
  "Sliced Mushrooms": [22, 90, 0.5, 0.1, 0.5, 0.3, 1.5, 3.1, 0.01],
  "New Potatoes": [75, 320, 0.2, 0, 17, 1.5, 1.5, 1.8, 0.02],
  "Baked Jacket Potato": [95, 405, 0.2, 0.1, 21, 1.5, 2.5, 2.5, 0.02],
  "Sweet Potato": [90, 380, 0.3, 0.1, 20, 6.0, 3.0, 1.6, 0.05],
  "Butternut Squash": [45, 190, 0.1, 0, 10, 4.5, 2.0, 1.0, 0.01],
  "Leeks": [33, 140, 0.3, 0.1, 5.5, 3.5, 2.8, 1.6, 0.01],
  "Fresh Basil": [25, 105, 0.6, 0, 2.5, 1.0, 2.0, 3.0, 0.01],
  "Fresh Coriander": [25, 105, 0.5, 0, 2.0, 0.9, 2.8, 2.2, 0.05],
  "Celery Batons": [15, 65, 0.2, 0, 1.5, 1.2, 1.6, 0.7, 0.15],
  "Sundried Tomatoes": [210, 875, 14, 2.0, 15, 13, 4.5, 5.0, 2.5],
  "Strawberries": [32, 135, 0.3, 0, 6.0, 5.8, 2.0, 0.7, 0.01],
  "Pineapple": [50, 210, 0.2, 0, 12, 10, 1.4, 0.5, 0.01],
  "Grapes": [68, 290, 0.2, 0, 15.5, 15.5, 0.9, 0.6, 0.01],
  "Melon": [34, 145, 0.2, 0, 7.5, 7.0, 0.9, 0.8, 0.02],
  "Raisins": [300, 1270, 0.5, 0.1, 69, 59, 3.7, 3.1, 0.05],

  // ---------- Prepared items & other ----------
  "Baked Beans": [80, 340, 0.6, 0.1, 13, 4.5, 4.5, 4.7, 0.6],
  "Falafel": [310, 1290, 17, 2.0, 28, 2.5, 7.0, 9.0, 1.2],
  "Moroccan Falafel": [300, 1250, 16, 1.9, 28, 3.0, 7.0, 9.0, 1.3],
  "Beetroot Falafel": [290, 1210, 15, 1.8, 29, 5.0, 7.0, 8.0, 1.2],
  "Onion Bhaji": [250, 1040, 15, 1.5, 23, 4.0, 4.5, 6.0, 1.0],
  "Indian Snacks Selection": [260, 1085, 14, 1.5, 27, 3.5, 4.5, 6.0, 1.1],
  "BBQ Jackfruit": [95, 400, 0.5, 0.1, 20, 15, 2.5, 1.0, 1.0],
  "Macaroni": [160, 680, 0.8, 0.1, 32, 1.0, 1.5, 5.5, 0.01],
  "White Pasta": [160, 680, 0.8, 0.1, 32, 1.0, 1.5, 5.5, 0.01],
  "Noodles": [165, 700, 2.5, 0.4, 30, 0.5, 1.5, 5.5, 0.3],
  "Granola": [450, 1880, 17, 3.5, 60, 20, 7.0, 10, 0.1],
  "White Chocolate & Cranberry Cookie Mix": [480, 2010, 22, 13, 65, 38, 2.0, 5.5, 0.6],
  "Coleslaw": [160, 665, 14, 1.5, 7.0, 6.0, 1.5, 1.0, 0.4],
  "Coleslaw (fresh)": [165, 685, 14, 1.5, 7.5, 6.5, 1.5, 1.0, 0.4],
  "Cheese Savoury Mix": [330, 1370, 29, 12, 3.5, 2.5, 0.5, 14, 1.4],
  "Salt & Black Pepper": [125, 520, 1.6, 0.7, 32, 0.3, 13, 5.5, 50],
};

async function main() {
  const rows = await db.query.ingredients.findMany();
  let updated = 0;
  const unmatched: string[] = [];

  for (const row of rows) {
    const isEmpty =
      row.energyKcal === 0 && row.energyKj === 0 && row.fatG === 0 &&
      row.carbohydrateG === 0 && row.proteinG === 0;
    if (!isEmpty) continue;

    const panel = TYPICAL[row.name];
    if (!panel) {
      unmatched.push(row.name);
      continue;
    }
    await db
      .update(ingredients)
      .set({
        energyKcal: panel[0],
        energyKj: panel[1],
        fatG: panel[2],
        saturatesG: panel[3],
        carbohydrateG: panel[4],
        sugarsG: panel[5],
        fibreG: panel[6],
        proteinG: panel[7],
        saltG: panel[8],
      })
      .where(and(eq(ingredients.id, row.id)));
    updated++;
  }

  console.log(`Backfilled ${updated} ingredients.`);
  if (unmatched.length) {
    console.log(`No typical values for ${unmatched.length} (left at zero):`);
    for (const n of unmatched) console.log("  -", n);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
