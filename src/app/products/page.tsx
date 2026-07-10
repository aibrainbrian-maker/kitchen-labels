import Link from "next/link";
import { db } from "@/db";
import AllergenBadgeList from "@/components/AllergenBadgeList";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; allergen?: string }>;
}) {
  const { q, allergen } = await searchParams;

  const [allProducts, allAllergens] = await Promise.all([
    db.query.products.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      with: {
        productIngredients: {
          with: {
            ingredient: {
              with: { ingredientAllergens: { with: { allergen: true } } },
            },
          },
        },
      },
      orderBy: (t, { asc }) => asc(t.name),
    }),
    db.query.allergens.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  const withAllergens = allProducts.map((p) => {
    const names = new Set<string>();
    const slugs = new Set<string>();
    for (const pi of p.productIngredients) {
      for (const ia of pi.ingredient.ingredientAllergens) {
        names.add(ia.allergen.name);
        slugs.add(ia.allergen.slug);
      }
    }
    return { ...p, allergenNames: [...names].sort(), allergenSlugs: slugs };
  });

  const query = q?.toLowerCase().trim();
  const filtered = withAllergens.filter((p) => {
    if (query && !p.name.toLowerCase().includes(query)) return false;
    if (allergen && !p.allergenSlugs.has(allergen)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
        <Link
          href="/products/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add product
        </Link>
      </div>

      <form className="mb-6 flex flex-wrap gap-3" action="/products" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="w-full max-w-xs rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        />
        <select
          name="allergen"
          defaultValue={allergen ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        >
          <option value="">Any allergen</option>
          {allAllergens.map((a) => (
            <option key={a.id} value={a.slug}>
              Contains: {a.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Filter
        </button>
      </form>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {allProducts.length === 0
            ? "No products yet. Add your first product, then build its recipe from your ingredients library."
            : "No products match your search."}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    {p.isFavorite && <span title="Favourite">★ </span>}
                    {p.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {p.category && (
                      <span className="text-xs text-neutral-500">{p.category}</span>
                    )}
                    <AllergenBadgeList
                      names={p.allergenNames}
                      emptyText={
                        p.productIngredients.length === 0
                          ? "No recipe yet"
                          : "No allergens"
                      }
                    />
                  </div>
                </div>
                <span className="text-sm text-neutral-400">
                  {p.productIngredients.length} ingredient
                  {p.productIngredients.length === 1 ? "" : "s"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
