import { hunts, users, type Hunt, type InsertHunt, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export type HuntWithUser = Hunt & { username: string };

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByHunterId(hunterId: string): Promise<User | undefined>;
  assignHunterId(userId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  updateUsername(userId: string, username: string): Promise<User | undefined>;
  deleteHunt(userId: string, huntId: string): Promise<void>;
  getAllHuntsWithUsers(): Promise<HuntWithUser[]>;

  getAllHunts(userId: string): Promise<Hunt[]>;
  getHuntsByMode(userId: string, mode: string): Promise<Hunt[]>;
  getHunt(userId: string, monsterId: string, weaponId: string, mode: string): Promise<Hunt | undefined>;
  createHunt(userId: string, hunt: InsertHunt): Promise<Hunt>;
  updateHunt(userId: string, monsterId: string, weaponId: string, mode: string, hunt: InsertHunt & { date?: Date }): Promise<Hunt>;
  deleteHuntsByMode(userId: string, mode: string): Promise<void>;
  deleteAllHunts(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  getPublicProfile(username: string): Promise<{ user: User; hunts: Hunt[] } | undefined>;
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

  async getUserByHunterId(hunterId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.hunterId, hunterId));
    return user || undefined;
  }

  async assignHunterId(userId: string): Promise<User | undefined> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = String(Math.floor(Math.random() * 9000) + 1000);
      const existing = await this.getUserByHunterId(candidate);
      if (!existing) {
        const [user] = await db.update(users).set({ hunterId: candidate }).where(eq(users.id, userId)).returning();
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate a unique 4-digit Hunter ID
    let hunterId: string | undefined;
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = String(Math.floor(Math.random() * 9000) + 1000);
      const existing = await this.getUserByHunterId(candidate);
      if (!existing) { hunterId = candidate; break; }
    }
    const [user] = await db.insert(users).values({ ...insertUser, hunterId }).returning();
    return user;
  }

  async deleteHunt(userId: string, huntId: string): Promise<void> {
    await db.delete(hunts).where(and(eq(hunts.id, huntId), eq(hunts.userId, userId)));
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

  async updateUsername(userId: string, username: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ username }).where(eq(users.id, userId)).returning();
    return user;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(hunts).where(eq(hunts.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
  }

  async getPublicProfile(username: string): Promise<{ user: User; hunts: Hunt[] } | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) return undefined;
    const userHunts = await db.select().from(hunts).where(and(eq(hunts.userId, user.id), eq(hunts.isPb, true)));
    return { user, hunts: userHunts };
  }

  async deleteAllHunts(userId: string): Promise<void> {
    await db.delete(hunts).where(eq(hunts.userId, userId));
  }
}

export const storage = new DatabaseStorage();
