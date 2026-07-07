import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool } from "./db";
import { setupAuth } from "./auth";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auto-create/migrate tables on startup (safe for fresh and existing deployments)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hunts (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR REFERENCES users(id),
      monster_id TEXT NOT NULL,
      weapon_id TEXT NOT NULL,
      time_seconds INTEGER NOT NULL,
      is_pb BOOLEAN NOT NULL DEFAULT true,
      date TIMESTAMP NOT NULL DEFAULT NOW(),
      attempts INTEGER NOT NULL DEFAULT 1,
      mode TEXT NOT NULL DEFAULT 'solo'
    )
  `);

  // Add user_id column to existing hunts tables that don't have it yet
  await pool.query(`
    ALTER TABLE hunts ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id)
  `);

  // Add hunter_id column for existing users
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS hunter_id TEXT UNIQUE
  `).catch(() => {});

  // Add video_url column for hunt proof links
  await pool.query(`
    ALTER TABLE hunts ADD COLUMN IF NOT EXISTS video_url TEXT
  `).catch(() => {});

  // Make password nullable (migrating to username-only login)
  await pool.query(`
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL
  `).catch(() => {});

  // Pre-create session table so connect-pg-simple works reliably
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    )
  `).catch(() => {});
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `).catch(() => {});

  // Setup session auth
  setupAuth(app);

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
