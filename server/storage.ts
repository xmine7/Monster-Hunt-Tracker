import { hunts, type Hunt, type InsertHunt } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getAllHunts(): Promise<Hunt[]>;
  getHuntsByMode(mode: string): Promise<Hunt[]>;
  getHunt(monsterId: string, weaponId: string, mode: string): Promise<Hunt | undefined>;
  createHunt(hunt: InsertHunt): Promise<Hunt>;
  updateHunt(monsterId: string, weaponId: string, mode: string, hunt: InsertHunt): Promise<Hunt>;
  deleteHuntsByMode(mode: string): Promise<void>;
  deleteAllHunts(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAllHunts(): Promise<Hunt[]> {
    return await db.select().from(hunts);
  }

  async getHuntsByMode(mode: string): Promise<Hunt[]> {
    return await db.select().from(hunts).where(eq(hunts.mode, mode));
  }

  async getHunt(monsterId: string, weaponId: string, mode: string): Promise<Hunt | undefined> {
    const [hunt] = await db
      .select()
      .from(hunts)
      .where(and(eq(hunts.monsterId, monsterId), eq(hunts.weaponId, weaponId), eq(hunts.mode, mode)));
    return hunt || undefined;
  }

  async createHunt(insertHunt: InsertHunt): Promise<Hunt> {
    const [hunt] = await db
      .insert(hunts)
      .values(insertHunt)
      .returning();
    return hunt;
  }

  async updateHunt(monsterId: string, weaponId: string, mode: string, insertHunt: InsertHunt): Promise<Hunt> {
    const [hunt] = await db
      .update(hunts)
      .set(insertHunt)
      .where(and(eq(hunts.monsterId, monsterId), eq(hunts.weaponId, weaponId), eq(hunts.mode, mode)))
      .returning();
    return hunt;
  }

  async deleteHuntsByMode(mode: string): Promise<void> {
    await db.delete(hunts).where(eq(hunts.mode, mode));
  }

  async deleteAllHunts(): Promise<void> {
    await db.delete(hunts);
  }
}

export const storage = new DatabaseStorage();
