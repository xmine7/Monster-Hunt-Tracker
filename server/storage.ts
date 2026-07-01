import { hunts, users, type Hunt, type InsertHunt, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export type HuntWithUser = Hunt & { username: string };

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllHuntsWithUsers(): Promise<HuntWithUser[]>;

  getAllHunts(userId: string): Promise<Hunt[]>;
  getHuntsByMode(userId: string, mode: string): Promise<Hunt[]>;
  getHunt(userId: string, monsterId: string, weaponId: string, mode: string): Promise<Hunt | undefined>;
  createHunt(userId: string, hunt: InsertHunt): Promise<Hunt>;
  updateHunt(userId: string, monsterId: string, weaponId: string, mode: string, hunt: InsertHunt & { date?: Date }): Promise<Hunt>;
  deleteHuntsByMode(userId: string, mode: string): Promise<void>;
  deleteAllHunts(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllHuntsWithUsers(): Promise<HuntWithUser[]> {
    const result = await db
      .select({
        id: hunts.id,
        userId: hunts.userId,
        username: users.username,
        monsterId: hunts.monsterId,
        weaponId: hunts.weaponId,
        timeSeconds: hunts.timeSeconds,
        isPb: hunts.isPb,
        date: hunts.date,
        attempts: hunts.attempts,
        mode: hunts.mode,
      })
      .from(hunts)
      .innerJoin(users, eq(hunts.userId, users.id));
    return result as HuntWithUser[];
  }

  async getAllHunts(userId: string): Promise<Hunt[]> {
    return await db.select().from(hunts).where(eq(hunts.userId, userId));
  }

  async getHuntsByMode(userId: string, mode: string): Promise<Hunt[]> {
    return await db.select().from(hunts).where(and(eq(hunts.userId, userId), eq(hunts.mode, mode)));
  }

  async getHunt(userId: string, monsterId: string, weaponId: string, mode: string): Promise<Hunt | undefined> {
    const [hunt] = await db
      .select()
      .from(hunts)
      .where(and(eq(hunts.userId, userId), eq(hunts.monsterId, monsterId), eq(hunts.weaponId, weaponId), eq(hunts.mode, mode)));
    return hunt || undefined;
  }

  async createHunt(userId: string, insertHunt: InsertHunt): Promise<Hunt> {
    const [hunt] = await db.insert(hunts).values({ ...insertHunt, userId }).returning();
    return hunt;
  }

  async updateHunt(userId: string, monsterId: string, weaponId: string, mode: string, insertHunt: InsertHunt & { date?: Date }): Promise<Hunt> {
    const [hunt] = await db
      .update(hunts)
      .set(insertHunt)
      .where(and(eq(hunts.userId, userId), eq(hunts.monsterId, monsterId), eq(hunts.weaponId, weaponId), eq(hunts.mode, mode)))
      .returning();
    return hunt;
  }

  async deleteHuntsByMode(userId: string, mode: string): Promise<void> {
    await db.delete(hunts).where(and(eq(hunts.userId, userId), eq(hunts.mode, mode)));
  }

  async deleteAllHunts(userId: string): Promise<void> {
    await db.delete(hunts).where(eq(hunts.userId, userId));
  }
}

export const storage = new DatabaseStorage();
