import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import type { Express } from "express";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export function setupAuth(app: Express) {
  // Trust Railway's proxy so secure cookies work over HTTPS
  app.set("trust proxy", 1);

  const PgSession = connectPg(session);
  app.use(
    session({
      store: new PgSession({
        pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "mhw-tracker-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );
}
