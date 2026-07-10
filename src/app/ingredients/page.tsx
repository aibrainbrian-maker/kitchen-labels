import Link from "next/link";
import { db } from "@/db";
import { deleteIngredient } from "./actions";

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const allIngredients = await db.query.ingredients.findMany({
    with: { ingredientAllergens: { with: { allergen: true } } },
    orderBy: (t, { asc }) => asc(t.name),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Ingredients library
        </h1>
        <Link
          href="/ingredients/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Add ingredient
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {allIngredients.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No ingredients yet. Add your first ingredient to start building product recipes.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {allIngredients.map((ing) => (
            <li key={ing.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium text-neutral-900">{ing.name}</p>
                {ing.ingredientAllergens.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ing.ingredientAllergens.map(({ allergen }) => (
                      <span
                        key={allergen.id}
                        className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                      >
                        {allergen.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/ingredients/${ing.id}`}
                  className="text-sm font-medium text-neutral-700 hover:underline"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteIngredient(ing.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
