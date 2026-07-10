/* eslint-disable @next/next/no-img-element */
import { db } from "@/db";
import LabelPreview from "@/components/LabelPreview";
import { buildSampleLabelContent } from "@/lib/labels/sample-content";
import {
  createBrandTemplate,
  updateBrandTemplate,
  removeBrandLogo,
  setDefaultBrandTemplate,
  deleteBrandTemplate,
  updateCategoryColor,
  addCategory,
} from "./actions";

export default async function LabelTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;

  const [templates, categories, labelSizes] = await Promise.all([
    db.query.brandTemplates.findMany({
      orderBy: (t, { desc, asc }) => [desc(t.isDefault), asc(t.name)],
    }),
    db.query.labelCategories.findMany({ orderBy: (t, { asc }) => asc(t.sortOrder) }),
    db.query.labelSizes.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => asc(t.name),
    }),
  ]);

  const sizeById = new Map(labelSizes.map((s) => [s.id, s]));
  const fallbackSize = labelSizes.find((s) => s.template === "wrap") ?? labelSizes[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        Label template designer
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        Create a branding template per customer or café — each holds a logo and
        the business details printed in the label footer. Pick which one to use
        when you create a print run.
      </p>

      {saved && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">Saved.</p>
      )}
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <section className="mb-12 space-y-6">
        {templates.map((t) => {
          const size = (t.labelSizeId && sizeById.get(t.labelSizeId)) || fallbackSize;
          const sample = buildSampleLabelContent(t);
          return (
          <div key={t.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                {t.name}
                {t.isDefault && (
                  <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                    Default
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3 text-sm">
                {!t.isDefault && (
                  <>
                    <form
                      action={async () => {
                        "use server";
                        await setDefaultBrandTemplate(t.id);
                      }}
                    >
                      <button type="submit" className="font-medium text-neutral-600 hover:underline">
                        Make default
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await deleteBrandTemplate(t.id);
                      }}
                    >
                      <button type="submit" className="font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex h-24 w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300">
                  {t.logoDataUrl ? (
                    <>
                      <img
                        src={t.logoDataUrl}
                        alt={`${t.name} logo`}
                        className="max-h-16 max-w-36 object-contain"
                      />
                      <form
                        action={async () => {
                          "use server";
                          await removeBrandLogo(t.id);
                        }}
                      >
                        <button type="submit" className="text-xs text-red-600 hover:underline">
                          Remove logo
                        </button>
                      </form>
                    </>
                  ) : (
                    <span className="text-xs text-neutral-400">No logo yet</span>
                  )}
                </div>

                <form
                  action={updateBrandTemplate.bind(null, t.id)}
                  className="grid w-72 gap-3"
                >
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">
                      Template name
                    </label>
                    <input
                      name="name"
                      required
                      defaultValue={t.name}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">
                      Label set-up
                    </label>
                    <select
                      name="labelSizeId"
                      defaultValue={t.labelSizeId ?? fallbackSize?.id}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                    >
                      {labelSizes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">
                      Business name (label footer)
                    </label>
                    <input
                      name="businessName"
                      defaultValue={t.businessName ?? ""}
                      placeholder="e.g. Eatlunch Ltd"
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">
                      Address (label footer)
                    </label>
                    <input
                      name="businessAddress"
                      defaultValue={t.businessAddress ?? ""}
                      placeholder="e.g. Unit 5 Sutherland Court, Welwyn Garden City, AL7 1BJ"
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-500">
                      Replace logo (PNG/JPEG, under 500KB)
                    </label>
                    <input type="file" name="logo" accept="image/png,image/jpeg" className="text-xs" />
                  </div>
                  <fieldset className="grid gap-1.5 text-sm text-neutral-700">
                    <legend className="mb-1 text-xs font-medium text-neutral-500">
                      Label styling
                    </legend>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="showStars" defaultChecked={t.showStars} />
                      Five stars above the logo (in the category colour)
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="tintLogo" defaultChecked={t.tintLogo} />
                      Recolour logo to match the category colour
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="innerBorder" defaultChecked={t.innerBorder} />
                      Thin inner border line
                    </label>
                  </fieldset>
                  <div>
                    <button
                      type="submit"
                      className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-xs font-medium text-neutral-500">
                  Sample label — {size?.name ?? "no label set-up chosen"}
                </p>
                {size && (
                  <LabelPreview
                    content={sample}
                    widthMm={size.widthMm}
                    heightMm={size.heightMm}
                    template={size.template}
                    scale={size.template === "wrap" ? 2.2 : 3}
                  />
                )}
                <p className="mt-2 max-w-xs text-xs text-neutral-400">
                  Shown with sample product data. On wrap labels the top half
                  prints upside down on purpose — it reads correctly once
                  folded over the pack.
                </p>
              </div>
            </div>
          </div>
        );
        })}

        <div className="rounded-lg border border-dashed border-neutral-300 p-4">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">Add customer template</h2>
          <form action={createBrandTemplate} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Template name
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Riverside Café"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Label set-up
              </label>
              <select
                name="labelSizeId"
                defaultValue={fallbackSize?.id}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              >
                {labelSizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Business name (label footer)
              </label>
              <input
                name="businessName"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Address (label footer)
              </label>
              <input
                name="businessAddress"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Logo (PNG/JPEG, under 500KB)
              </label>
              <input type="file" name="logo" accept="image/png,image/jpeg" className="text-xs" />
            </div>
            <fieldset className="grid gap-1.5 text-sm text-neutral-700">
              <legend className="mb-1 text-xs font-medium text-neutral-500">
                Label styling
              </legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="showStars" />
                Five stars above the logo (in the category colour)
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="tintLogo" />
                Recolour logo to match the category colour
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="innerBorder" />
                Thin inner border line
              </label>
            </fieldset>
            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Add template
              </button>
            </div>
          </form>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">
          Border colour categories
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          Assign a category to each product in its edit screen — the label
          border takes the category colour (e.g. red for red meat, yellow for
          chicken, green for vegetarian, blue for seafood).
        </p>
        <ul className="mb-6 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-6 w-6 rounded-full border border-neutral-200"
                  style={{ backgroundColor: cat.colorHex }}
                />
                <span className="font-medium text-neutral-900">{cat.name}</span>
              </div>
              <form
                action={updateCategoryColor.bind(null, cat.id)}
                className="flex items-center gap-2"
              >
                <input
                  type="color"
                  name="colorHex"
                  defaultValue={cat.colorHex}
                  className="h-8 w-12 cursor-pointer rounded border border-neutral-300"
                />
                <button type="submit" className="text-sm font-medium text-neutral-600 hover:underline">
                  Update
                </button>
              </form>
            </li>
          ))}
        </ul>

        <h3 className="mb-2 text-sm font-semibold text-neutral-700">Add category</h3>
        <form action={addCategory} className="flex items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Vegan"
              className="rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Colour</label>
            <input
              type="color"
              name="colorHex"
              defaultValue="#8a63bf"
              className="h-10 w-14 cursor-pointer rounded border border-neutral-300"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
          >
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
