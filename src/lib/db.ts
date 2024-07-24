import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { env } from "@lib/env";

const client = new Client({
  connectionString: env.DATABASE_URL,
});

await client.connect();
export const db = drizzle(client);

/**
 * Get the first element of an array or null if the array is empty.
 *
 * @param rows The array to get the first element of.
 * @returns The first element of the array or null if the array is empty.
 *
 * @example
 * ```ts
 * await db.select().from(Users).then(getFirst);
 * ```
 */
export const getFirst = <T>(rows: T[]): T | null => rows[0] ?? null;
