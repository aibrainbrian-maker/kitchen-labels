import { db } from "@/db";
import IngredientForm from "@/components/IngredientForm";
import { createIngredient } from "../actions";

export default async function NewIngredientPage() {
  const allergens = await db.query.allergens.findMany({
    orderBy: (t, { asc }) => asc(t.name),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
        Add ingredient
      </h1>
      <IngredientForm action={createIngredient} allergens={allergens} submitLabel="Add ingredient" />
    </div>
  );
}
