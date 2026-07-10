import { db } from "@/db";
import ProductForm from "@/components/ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const [labelSizes, labelCategories] = await Promise.all([
    db.query.labelSizes.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
      orderBy: (t, { asc }) => asc(t.name),
    }),
    db.query.labelCategories.findMany({
      orderBy: (t, { asc }) => asc(t.sortOrder),
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Add product</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Create the product first, then build its recipe from your ingredients
        library on the next screen.
      </p>
      <ProductForm
        action={createProduct}
        labelSizes={labelSizes}
        labelCategories={labelCategories}
        submitLabel="Create product"
      />
    </div>
  );
}
