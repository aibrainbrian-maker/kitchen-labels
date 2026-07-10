import { NUTRITION_FIELDS } from "@/lib/nutrition-fields";

type AllergenOption = { id: number; name: string };

export default function IngredientForm({
  action,
  allergens,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  allergens: AllergenOption[];
  defaultValues?: {
    name: string;
    notes: string | null;
    energyKcal: number;
    energyKj: number;
    fatG: number;
    saturatesG: number;
    carbohydrateG: number;
    sugarsG: number;
    fibreG: number;
    proteinG: number;
    saltG: number;
    allergenIds: number[];
  };
  submitLabel: string;
}) {
  const selected = new Set(defaultValues?.allergenIds ?? []);

  return (
    <form action={action} className="space-y-6 max-w-xl">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Ingredient name
        </label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Cheddar cheese"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Notes (optional)
        </label>
        <input
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. supplier, brand"
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-700">
          Allergens present in this ingredient
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {allergens.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
            >
              <input
                type="checkbox"
                name="allergenIds"
                value={a.id}
                defaultChecked={selected.has(a.id)}
                className="h-4 w-4"
              />
              {a.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-neutral-700">
          Nutrition per 100g
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NUTRITION_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-neutral-500">
                {f.label} ({f.unit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                name={f.key}
                defaultValue={defaultValues?.[f.key] ?? 0}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2.5 text-base font-medium text-white hover:bg-neutral-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
