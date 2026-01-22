import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHuntSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all hunts
  app.get("/api/hunts", async (req, res) => {
    try {
      const hunts = await storage.getAllHunts();
      res.json(hunts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hunts" });
    }
  });

  // Create or update a hunt
  app.post("/api/hunts", async (req, res) => {
    try {
      const validatedData = insertHuntSchema.parse(req.body);
      
      // Check if hunt already exists for this monster/weapon combo
      const existing = await storage.getHunt(validatedData.monsterId, validatedData.weaponId);
      
      if (existing) {
        // Update existing hunt
        const updated = await storage.updateHunt(
          validatedData.monsterId, 
          validatedData.weaponId, 
          validatedData
        );
        res.json(updated);
      } else {
        // Create new hunt
        const created = await storage.createHunt(validatedData);
        res.json(created);
      }
    } catch (error) {
      res.status(400).json({ error: "Invalid hunt data" });
    }
  });

  // Reset all hunts
  app.delete("/api/hunts", async (req, res) => {
    try {
      await storage.deleteAllHunts();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset hunts" });
    }
  });

  return httpServer;
}
