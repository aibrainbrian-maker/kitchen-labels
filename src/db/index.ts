import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  // Next.js loads .env.local automatically for the app itself, but standalone
  // scripts run via tsx (seed, etc.) need it loaded explicitly.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({ path: ".env.local" });
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// prepare:false keeps us compatible with transaction-mode connection poolers
// (e.g. Neon's pooled endpoint, recommended for serverless/Vercel), which
// don't support prepared statements. Harmless for a direct local connection.
const client = postgres(process.env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
