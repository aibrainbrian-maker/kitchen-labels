import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { loadProductWithDerived } from "@/lib/product-data";
import { NUTRITION_FIELDS } from "@/lib/nutrition-fields";
import ProductForm from "@/components/ProductForm";
import AllergenBadgeList from "@/components/AllergenBadgeList";
import {
  updateProduct,
  deleteProduct,
  toggleFavorite,
  addRecipeIngredient,
  removeRecipeIngredient,
  useRecipeNutrition,
} from "../actions";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);

  const [loaded, labelSizes, labelCategories, allIngredients] = await Promise.all([
    loadProductWithDerived(productId),
    db.query.labelSizes.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => asc(t.name),
    }),
    db.query.labelCategories.findMany({
      orderBy: (t, { asc }) => asc(t.sortOrder),
    }),
    db.query.ingredients.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  if (!loaded) notFound();
  const { product, derived, allergenNamesBySlug } = loaded;

  const allergenNames = derived.allergenSlugs.map(
    (slug) => allergenNamesBySlug.get(slug) ?? slug
  );

  const addWithId = addRecipeIngredient.bind(null, productId);
  const updateWithId = updateProduct.bind(null, productId);

  const nutritionRows = NUTRITION_FIELDS.map((f) => ({
    ...f,
    per100g: derived.nutritionPer100g[f.key],
    perPack:
      (derived.nutritionPer100g[f.key] * derived.totalWeightGrams) / 100,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/products" className="text-sm text-neutral-500 hover:underline">
            ← Products
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {product.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <form
            action={async () => {
              "use server";
              await toggleFavorite(productId, !product.isFavorite);
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {product.isFavorite ? "★ Favourited" : "☆ Favourite"}
            </button>
          </form>
          <Link
            href={`/products/${productId}/preview`}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Preview label
          </Link>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recipe builder */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Recipe</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Pick ingredients and weights. The label&apos;s ingredient list order
            (heaviest first), allergens, and nutrition are all worked out
            automatically.
          </p>

          {(product.placeholderWeights || product.nutritionOverride != null) && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Imported product</p>
              <p className="mt-1">
                {product.nutritionOverride != null
                  ? "The label prints the supplier's nutrition panel, not values calculated from this recipe."
                  : "No supplier nutrition panel — the label omits the nutrition table."}{" "}
                {product.placeholderWeights &&
                  "The recipe weights below are placeholders that only set the printed ingredient order."}
              </p>
              <form
                action={async () => {
                  "use server";
                  await useRecipeNutrition(productId);
                }}
                className="mt-2"
              >
                <button
                  type="submit"
                  className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
                >
                  Calculate nutrition from this recipe instead
                </button>
                <span className="ml-2 text-xs text-amber-800">
                  Enter the real weights first — this can&apos;t be undone.
                </span>
              </form>
            </div>
          )}

          <form action={addWithId} className="mb-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Ingredient
              </label>
              <select
                name="ingredientId"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
              >
                <option value="">Choose…</option>
                {allIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Weight (g)
              </label>
              <input
                type="number"
                name="weightGrams"
                min="0.1"
                step="0.1"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
            >
              Add
            </button>
          </form>

          {allIngredients.length === 0 && (
            <p className="mb-4 text-sm text-amber-700">
              Your ingredients library is empty —{" "}
              <Link href="/ingredients/new" className="underline">
                add ingredients
              </Link>{" "}
              first.
            </p>
          )}

          {derived.ingredients.length === 0 ? (
            <p className="text-sm text-neutral-500">No ingredients in this recipe yet.</p>
          ) : (
            <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
              {product.productIngredients
                .slice()
                .sort((a, b) => b.weightGrams - a.weightGrams)
                .map((pi) => (
                  <li key={pi.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <span className="font-medium text-neutral-900">
                        {pi.ingredient.name}
                      </span>
                      <span className="ml-2 text-sm text-neutral-500">
                        {pi.weightGrams}g
                      </span>
                      {pi.ingredient.ingredientAllergens.length > 0 && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          allergen
                        </span>
                      )}
                    </div>
                    <form
                      action={async () => {
                        "use server";
                        await removeRecipeIngredient(productId, pi.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
          )}

          {/* Derived label declaration */}
          {derived.ingredients.length > 0 && (
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="mb-1 text-sm font-semibold text-neutral-700">
                  Ingredient declaration (as it will print)
                </h3>
                <p className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed">
                  <span className="font-semibold">Ingredients: </span>
                  {derived.ingredients.map((ing, i) => (
                    <span key={ing.name}>
                      {i > 0 && ", "}
                      {ing.isAllergen ? (
                        <strong className="font-bold">{ing.name}</strong>
                      ) : (
                        ing.name
                      )}
                    </span>
                  ))}
                </p>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-neutral-700">
                  Allergens in this product
                </h3>
                <AllergenBadgeList names={allergenNames} emptyText="None of the 14 regulated allergens" />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-neutral-700">
                  Nutrition (total weight {Math.round(derived.totalWeightGrams)}g)
                </h3>
                <table className="w-full rounded-lg border border-neutral-200 bg-white text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
                      <th className="px-3 py-2 font-medium">Typical values</th>
                      <th className="px-3 py-2 font-medium">Per 100g</th>
                      <th className="px-3 py-2 font-medium">Per pack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nutritionRows.map((row) => (
                      <tr key={row.key} className="border-b border-neutral-100 last:border-0">
                        <td className="px-3 py-1.5">
                          {row.label} ({row.unit})
                        </td>
                        <td className="px-3 py-1.5">{row.per100g.toFixed(1)}</td>
                        <td className="px-3 py-1.5">{row.perPack.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Product details */}
        <section>
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Details</h2>
          <ProductForm
            action={updateWithId}
            labelSizes={labelSizes}
            labelCategories={labelCategories}
            submitLabel="Save changes"
            defaultValues={{
              name: product.name,
              category: product.category,
              description: product.description,
              pricePence: product.pricePence,
              labelCategoryId: product.labelCategoryId,
              shelfLifeValue: product.shelfLifeValue,
              shelfLifeUnit: product.shelfLifeUnit,
              shelfLifeType: product.shelfLifeType,
              storageInstructions: product.storageInstructions,
              defaultLabelSizeId: product.defaultLabelSizeId,
            }}
          />

          <div className="mt-8 border-t border-neutral-200 pt-4">
            <form
              action={async () => {
                "use server";
                await deleteProduct(productId);
              }}
            >
              <button
                type="submit"
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Delete this product
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
