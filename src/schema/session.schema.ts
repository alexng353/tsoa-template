import { sql } from "drizzle-orm";
import {
  text,
  timestamp,
  pgTable,
  uuid,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";
import { now } from "./common";
import { Users } from "./users";

export const Sessions = pgTable("sessions", {
  id: uuid("id")
    .primaryKey()
    .unique()
    .notNull()
    .default(sql`gen_random_uuid()`),

  user_id: uuid("user_id")
    .notNull()
    .references(() => Users.id),
  created_at: timestamp("created_at").notNull().default(now()),
  expires_at: timestamp("expires_at").notNull(),

  /** No idea what this does. */
  is_active: boolean("is_active").notNull().default(true),

  force_expire: boolean("force_expire").notNull().default(false),
  reason_force_expire: text("reason_force_expire").default(""),

  ip_address: varchar("ip_address", { length: 45 }).notNull(),
});

export type Session = typeof Sessions.$inferSelect;
export type InsertSession = typeof Sessions.$inferInsert;
