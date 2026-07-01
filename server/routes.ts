import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema } from "@shared/schema";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Who am I?
  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json(null);
    const user = req.user as any;
    res.json({ id: user.id, username: user.username });
  });

  // Register with username only
  app.post("/api/register", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || username.trim().length < 2) {
        return res.status(400).json({ error: "Username must be at least 2 characters" });
      }
      const existing = await storage.getUserByUsername(username.trim());
      if (existing) {
        return res.status(400).json({ error: "That username is already taken — pick another one!" });
      }
      const user = await storage.createUser({ username: username.trim() });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after registration" });
        res.json({ id: user.id, username: user.username });
      });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login with username only
  app.post("/api/login", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || !username.trim()) {
        return res.status(400).json({ error: "Username is required" });
      }
      const user = await storage.getUserByUsername(username.trim());
      if (!user) {
        return res.status(401).json({ error: "Username not found — have you registered yet?" });
      }
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed" });
        res.json({ id: user.id, username: user.username });
      });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ success: true }));
  });

  // Admin: reset username (in case someone wants to change it)
  app.post("/api/admin/reset-password", async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    const { secret, username, newUsername } = req.body;
    if (!adminSecret || secret !== adminSecret) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!username) return res.status(400).json({ error: "username required" });
    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, message: `User ${username} exists and can log in with their username` });
  });

  // Hunt routes (all require auth, all scoped to logged-in user)
  app.get("/api/hunts", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const mode = req.query.mode as string;
      const hunts = mode
        ? await storage.getHuntsByMode(userId, mode)
        : await storage.getAllHunts(userId);
      res.json(hunts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hunts" });
    }
  });

  app.post("/api/hunts", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertHuntSchema.parse(req.body);
      const mode = validatedData.mode || "solo";
      const existing = await storage.getHunt(userId, validatedData.monsterId, validatedData.weaponId, mode);
      if (existing) {
        const updated = await storage.updateHunt(userId, validatedData.monsterId, validatedData.weaponId, mode, { ...validatedData, date: new Date() });
        res.json(updated);
      } else {
        const created = await storage.createHunt(userId, validatedData);
        res.json(created);
      }
    } catch (error) {
      res.status(400).json({ error: "Invalid hunt data" });
    }
  });

  app.delete("/api/hunts", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const mode = req.query.mode as string;
      if (mode) {
        await storage.deleteHuntsByMode(userId, mode);
      } else {
        await storage.deleteAllHunts(userId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset hunts" });
    }
  });

  app.get("/api/leaderboard", requireAuth, async (req, res) => {
    try {
      const allHunts = await storage.getAllHuntsWithUsers();
      res.json(allHunts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  return httpServer;
}
