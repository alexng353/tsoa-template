import { sql } from "drizzle-orm";
import {
  boolean,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { now, Update } from "./common";

export const Users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .unique()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // TODO: make this lowercase
  image_url: text("image_url").notNull().default(""),

  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  is_email_verified: boolean("is_email_verified").notNull().default(false),

  // TODO: deal with this
  // username: text("username").default(""),
  /** argon2id hashed password */
  password_hash: text("password_hash").notNull(),
  is_temporary_password: boolean("is_temporary_password").default(false),

  known_ips: varchar("known_ips", { length: 45 })
    .array()
    .default(sql`ARRAY[]::varchar[]`),

  created_at: timestamp("created_at").notNull().default(now()),

  updates: json("updates").$type<Update[]>().default([]),
});

export type User = typeof Users.$inferSelect;
export type InsertUser = typeof Users.$inferInsert;

export type UserNoPassword = Omit<User, "password_hash">;
