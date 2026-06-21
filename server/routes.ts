import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema } from "@shared/schema";
import passport from "passport";
import { hashPassword } from "./auth";

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
  // Auth routes
  app.get("/api/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.status(401).json(null);
    const user = req.user as any;
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      if (username.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
      });
      req.login(user, (err) => {
        if (err) return res.status(500).json({ error: "Login failed after registration" });
        res.json({ id: user.id, username: user.username });
      });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Invalid credentials" });
      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ success: true }));
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
        const updated = await storage.updateHunt(
          userId,
          validatedData.monsterId,
          validatedData.weaponId,
          mode,
          { ...validatedData, date: new Date() }
        );
        res.json(updated);
      } else {
        const created = await storage.createHunt(userId, validatedData);
        res.json(created);
      }
    } catch (error) {
      res.status(400).json({ error: "Invalid hunt data" });
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

  return httpServer;
}
