import { notFound } from "next/navigation";
import { db } from "@/db";
import IngredientForm from "@/components/IngredientForm";
import { updateIngredient } from "../actions";

export default async function EditIngredientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ingredientId = Number(id);

  const [ingredient, allergens] = await Promise.all([
    db.query.ingredients.findFirst({
      where: (t, { eq }) => eq(t.id, ingredientId),
      with: { ingredientAllergens: true },
    }),
    db.query.allergens.findMany({ orderBy: (t, { asc }) => asc(t.name) }),
  ]);

  if (!ingredient) notFound();

  const updateWithId = updateIngredient.bind(null, ingredientId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
        Edit ingredient
      </h1>
      <IngredientForm
        action={updateWithId}
        allergens={allergens}
        submitLabel="Save changes"
        defaultValues={{
          name: ingredient.name,
          notes: ingredient.notes,
          energyKcal: ingredient.energyKcal,
          energyKj: ingredient.energyKj,
          fatG: ingredient.fatG,
          saturatesG: ingredient.saturatesG,
          carbohydrateG: ingredient.carbohydrateG,
          sugarsG: ingredient.sugarsG,
          fibreG: ingredient.fibreG,
          proteinG: ingredient.proteinG,
          saltG: ingredient.saltG,
          allergenIds: ingredient.ingredientAllergens.map((ia) => ia.allergenId),
        }}
      />
    </div>
  );
}
