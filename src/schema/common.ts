import { sql } from "drizzle-orm";

export type Update = {
  type: string;
  timestamp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
};

/**
 * Literally just a wrapper around sql\`now()\`
 */
export const now = () => sql`now()`;
