import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const hunts = pgTable("hunts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monsterId: text("monster_id").notNull(),
  weaponId: text("weapon_id").notNull(),
  timeSeconds: integer("time_seconds").notNull(),
  isPb: boolean("is_pb").notNull().default(true),
  date: timestamp("date").notNull().defaultNow(),
  attempts: integer("attempts").notNull().default(1),
});

export const insertHuntSchema = createInsertSchema(hunts).omit({
  id: true,
  date: true,
});

export type InsertHunt = z.infer<typeof insertHuntSchema>;
export type Hunt = typeof hunts.$inferSelect;
