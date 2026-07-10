import { db } from "@/db";
import { createLabelSize, setLabelSizeActive } from "./actions";

export default async function LabelSizesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const sizes = await db.query.labelSizes.findMany({
    orderBy: (t, { asc }) => asc(t.name),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Label sheet sizes</h1>
      <p className="mb-6 text-sm text-neutral-500">
        A4 sticker sheet layouts. The Avery presets cover the most common UK
        sheets — add a custom layout for any other brand using the measurements
        on its packet.
      </p>

      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-10 overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Label size</th>
              <th className="px-4 py-2 font-medium">Per sheet</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-neutral-900">
                  {s.name}
                  {s.isCustom && (
                    <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      custom
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {s.widthMm} × {s.heightMm} mm
                </td>
                <td className="px-4 py-2.5">
                  {s.cols && s.rows ? `${s.cols * s.rows} (${s.cols} × ${s.rows})` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  {s.isActive ? (
                    <span className="text-green-700">Active</span>
                  ) : (
                    <span className="text-neutral-400">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await setLabelSizeActive(s.id, !s.isActive);
                    }}
                  >
                    <button type="submit" className="text-sm font-medium text-neutral-600 hover:underline">
                      {s.isActive ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Add custom A4 layout</h2>
      <form action={createLabelSize} className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-3">
          <label className="mb-1 block text-sm font-medium text-neutral-700">Name</label>
          <input
            name="name"
            required
            placeholder="e.g. Supermarket own-brand 24/sheet"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
          />
        </div>
        {(
          [
            ["widthMm", "Label width (mm)", true],
            ["heightMm", "Label height (mm)", true],
            ["cols", "Columns", true],
            ["rows", "Rows", true],
            ["marginTopMm", "Top margin (mm)", false],
            ["marginLeftMm", "Left margin (mm)", false],
            ["gapXMm", "Horizontal gap (mm)", false],
            ["gapYMm", "Vertical gap (mm)", false],
          ] as const
        ).map(([name, label, required]) => (
          <div key={name}>
            <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name={name}
              required={required}
              defaultValue={required ? undefined : 0}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base focus:border-neutral-500 focus:outline-none"
            />
          </div>
        ))}
        <div className="col-span-2 sm:col-span-3">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2.5 text-base font-medium text-white hover:bg-neutral-700"
          >
            Add layout
          </button>
        </div>
      </form>
    </div>
  );
}
