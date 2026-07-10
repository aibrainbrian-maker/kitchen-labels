type LabelSizeOption = { id: number; name: string };
type LabelCategoryOption = { id: number; name: string; colorHex: string };

export default function ProductForm({
  action,
  labelSizes,
  labelCategories,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  labelSizes: LabelSizeOption[];
  labelCategories: LabelCategoryOption[];
  defaultValues?: {
    name: string;
    category: string | null;
    description: string | null;
    pricePence: number | null;
    labelCategoryId: number | null;
    shelfLifeValue: number;
    shelfLifeUnit: "hours" | "days" | "weeks";
    shelfLifeType: "use_by" | "best_before";
    storageInstructions: string | null;
    defaultLabelSizeId: number | null;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5 max-w-xl">
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Product name
        </label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Ham & Cheese Sandwich"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Label description (shown under the name on the label)
        </label>
        <input
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Cumberland Sausage, Streaky Bacon and Free Range Egg"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Price (£)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="pricePounds"
            defaultValue={
              defaultValues?.pricePence != null
                ? (defaultValues.pricePence / 100).toFixed(2)
                : ""
            }
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
            placeholder="3.80"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Border colour category
          </label>
          <select
            name="labelCategoryId"
            defaultValue={defaultValues?.labelCategoryId ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          >
            <option value="">None (grey border)</option>
            {labelCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Category (optional)
        </label>
        <input
          name="category"
          defaultValue={defaultValues?.category ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Sandwiches"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Shelf life
          </label>
          <input
            type="number"
            min="1"
            name="shelfLifeValue"
            required
            defaultValue={defaultValues?.shelfLifeValue ?? 2}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Unit
          </label>
          <select
            name="shelfLifeUnit"
            defaultValue={defaultValues?.shelfLifeUnit ?? "days"}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          >
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Date type shown on label
        </label>
        <select
          name="shelfLifeType"
          defaultValue={defaultValues?.shelfLifeType ?? "use_by"}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        >
          <option value="use_by">Use by</option>
          <option value="best_before">Best before</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Storage instructions
        </label>
        <input
          name="storageInstructions"
          defaultValue={defaultValues?.storageInstructions ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          placeholder="e.g. Keep refrigerated below 5°C"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Default label size (optional)
        </label>
        <select
          name="defaultLabelSizeId"
          defaultValue={defaultValues?.defaultLabelSizeId ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
        >
          <option value="">No default</option>
          {labelSizes.map((ls) => (
            <option key={ls.id} value={ls.id}>
              {ls.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md bg-neutral-900 px-4 py-2.5 text-base font-medium text-white hover:bg-neutral-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
