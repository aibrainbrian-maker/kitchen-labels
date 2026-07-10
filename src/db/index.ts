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

const client = postgres(process.env.DATABASE_URL);

export const db = drizzle(client, { schema });
