import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema } from "@shared/schema";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Who am I?
  app.get("/api/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json(null);
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json(null);
      }
      res.json({ id: user.id, username: user.username, hunterId: user.hunterId });
    } catch {
      res.status(500).json(null);
    }
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
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: "Registration failed, try again" });
        res.json({ id: user.id, username: user.username });
      });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login with username OR hunter ID
  app.post("/api/login", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username || !username.trim()) {
        return res.status(400).json({ error: "Username or Hunter ID is required" });
      }
      const input = username.trim();
      // Try username first, then hunter ID (digits only)
      let user = await storage.getUserByUsername(input);
      if (!user && /^\d+$/.test(input)) {
        user = await storage.getUserByHunterId(input);
      }
      if (!user) {
        return res.status(401).json({ error: "Not found — check your username or Hunter ID" });
      }
      // Auto-assign Hunter ID to older accounts that don't have one yet
      if (!user.hunterId) {
        user = await storage.assignHunterId(user.id) ?? user;
      }
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) return res.status(500).json({ error: "Login failed, try again" });
        res.json({ id: user!.id, username: user!.username, hunterId: user!.hunterId });
      });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // Hunt routes (all require auth, all scoped to logged-in user)
  app.get("/api/hunts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
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
      const userId = req.session.userId!;
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
      const userId = req.session.userId!;
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

  // Admin: check if a user exists
  app.post("/api/admin/reset-password", async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    const { secret, username } = req.body;
    if (!adminSecret || secret !== adminSecret) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!username) return res.status(400).json({ error: "username required" });
    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, message: `User ${username} exists` });
  });

  return httpServer;
}
