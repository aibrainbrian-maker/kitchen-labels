# Kitchen Labels

Food labelling app for a catering business, built for **Natasha's Law** (UK PPDS) compliance: every label carries the product name and a full ingredients list in descending weight order with the 14 regulated allergens emphasised in bold, plus use-by/best-before date, storage instructions, and computed nutrition.

Labels print as precisely-positioned PDFs onto standard A4 sticker sheets (Avery L7160/L7163/L7651 presets included, custom layouts supported) on any ordinary printer.

## How it works

- **Ingredients library** — each ingredient stores its allergens (from the fixed list of 14) and nutrition per 100g.
- **Products** are recipes: pick ingredients and weights. The ingredient list order, allergen set, and nutrition panel are all *derived automatically* from the recipe — they can never be forgotten or out of date.
- **Print runs** — set quantities across products, pick a sheet layout and prep date, and get one PDF for the whole batch. Use-by dates are computed from each product's shelf life. Partially-used sheets are supported via "start at label #".
- **History** — every run snapshots exactly what was printed for food-safety traceability; reprints regenerate from the snapshot, not the live recipe.

## Stack

Next.js (App Router) · TypeScript · Tailwind · Postgres + Drizzle ORM · NextAuth (credentials) · @react-pdf/renderer

## Local development

1. Start Postgres (any instance works; Docker example):
   ```bash
   docker run -d --name label-app-postgres \
     -e POSTGRES_USER=labelapp -e POSTGRES_PASSWORD=labelapp -e POSTGRES_DB=labelapp \
     -p 5432:5432 postgres:16-alpine
   ```
2. Create `.env.local`:
   ```
   DATABASE_URL=postgresql://labelapp:labelapp@localhost:5432/labelapp
   AUTH_SECRET=<generate with: npx auth secret>
   ```
3. Install, push schema, seed, create a login:
   ```bash
   npm install
   npm run db:push
   npm run db:seed                # 14 allergens + Avery sheet presets
   npm run db:create-user -- "Your Name" you@example.com yourpassword
   npm run dev
   ```

## Tests

```bash
npm test
```

Covers the compliance-critical logic: ingredient ordering, allergen union, nutrition aggregation, and sheet pagination (including start-position offset).

## Deploying (Vercel + Neon)

1. Create a Postgres database (e.g. [Neon](https://neon.tech) free tier).
2. Import this repo into [Vercel](https://vercel.com); set env vars `DATABASE_URL` and `AUTH_SECRET`.
3. After first deploy, run against the production DB from your machine:
   ```bash
   DATABASE_URL=<neon-url> npm run db:push
   DATABASE_URL=<neon-url> npm run db:seed
   DATABASE_URL=<neon-url> npm run db:create-user -- "Your Name" you@example.com strongpassword
   ```

## Printing tips

- In the print dialog, always choose **Actual size** — never "Fit to page" — or labels won't line up with the sheet die-cuts.
- Do a test print on plain paper and hold it against a label sheet before committing a full run.

## Compliance note

This app implements Natasha's Law requirements as understood at build time (product name; ingredients in descending weight order; the 14 regulated allergens emphasised in bold; ≥1.2mm x-height text). It is not legal advice — confirm your labels with your local Environmental Health Officer before relying on them in trade.
