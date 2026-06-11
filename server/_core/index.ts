import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { setupDuelMatchmaking } from "../duelMatchmaking";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { preloadSlangKnowledge } from "../slangKnowledgeLoader";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── 30-Day Referral Cookie Tracking ──────────────────────────────────
  // When someone visits with ?ref=CODE, set a 30-day cookie for attribution
  app.use((req, res, next) => {
    const refCode = req.query.ref as string;
    if (refCode && typeof refCode === "string" && refCode.trim()) {
      const hostname = req.hostname;
      const isLocal = ["localhost", "127.0.0.1", "::1"].includes(hostname);
      const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
      const parts = hostname.split(".");
      const domain = (!isLocal && !isIp && parts.length >= 3) ? "." + parts.slice(-2).join(".") : undefined;
      const isSecure = req.protocol === "https" || (req.headers["x-forwarded-proto"] || "").toString().includes("https");

      res.cookie("ref_code", refCode.trim().toUpperCase(), {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: isSecure,
        ...(domain ? { domain } : {}),
      });
      res.cookie("ref_ts", Date.now().toString(), {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: isSecure,
        ...(domain ? { domain } : {}),
      });
    }
    next();
  });

  // ─── Read referral cookie endpoint ────────────────────────────────────
  app.get("/api/referral-cookie", (req, res) => {
    const cookieHeader = req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const refCode = cookies.ref_code || null;
    const refTs = cookies.ref_ts ? parseInt(cookies.ref_ts) : null;
    const isExpired = refTs ? (Date.now() - refTs > 30 * 24 * 60 * 60 * 1000) : true;
    res.json({ refCode: isExpired ? null : refCode, refTimestamp: refTs });
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Push token registration endpoint (accepts tokens from app startup)
  // Stores with userId=0 initially; when user logs in, the authenticated
  // tRPC push.registerToken route updates the userId properly.
  app.post("/api/push-token", async (req, res) => {
    try {
      const { token, platform, deviceName } = req.body;
      if (!token || !platform) {
        res.status(400).json({ error: "token and platform are required" });
        return;
      }
      const { upsertPushToken } = await import("../db");
      await upsertPushToken({ userId: 0, token, platform, deviceName });
      res.json({ success: true });
    } catch (error: any) {
      console.warn("[PushToken] Registration failed:", error.message);
      res.status(500).json({ error: "Failed to register token" });
    }
  });

  // ─── RevenueCat Webhook Endpoint ──────────────────────────────────────
  app.post("/api/webhooks/revenuecat", async (req, res) => {
    const { handleRevenueCatWebhook } = await import("../revenuecatWebhook");
    await handleRevenueCatWebhook(req, res);
  });

  // Scheduled endpoint for auto-ingestion (called by heartbeat cron)
  app.post("/api/scheduled/auto-ingest", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        res.status(403).json({ error: "cron-only" });
        return;
      }

      const { runAutoIngestion } = await import("../autoIngestScheduler");
      const results = await runAutoIngestion();

      console.log(`[AutoIngest] Scheduled run complete: ${results.channelsChecked} channels, ${results.successfullyIngested} new items`);
      res.json({ ok: true, ...results });
    } catch (error: any) {
      console.error("[AutoIngest] Scheduled run failed:", error);
      res.status(500).json({
        error: error.message,
        stack: error.stack,
        context: { url: req.url, taskUid: "unknown" },
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Setup WebSocket matchmaking for pronunciation duels
  setupDuelMatchmaking(server);

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);

    // Pre-warm slang knowledge cache in background (non-blocking)
    preloadSlangKnowledge().catch(err => {
      console.warn("[SlangLoader] Pre-load failed (non-fatal):", err.message);
    });
  });
}

startServer().catch(console.error);
