import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password"), // kept for DB compatibility, no longer used
});

export const hunts = pgTable("hunts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  monsterId: text("monster_id").notNull(),
  weaponId: text("weapon_id").notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  isPb: boolean("is_pb").notNull().default(true),
  date: timestamp("date").notNull().defaultNow(),
  attempts: integer("attempts").notNull().default(1),
  mode: text("mode").notNull().default("solo"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, password: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertHuntSchema = createInsertSchema(hunts).omit({
  id: true,
  date: true,
  userId: true,
});

export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type Hunt = typeof hunts.$inferSelect;
export type HuntMode = "solo" | "duo" | "squad";
