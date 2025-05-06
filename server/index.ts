import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable for Render.com deployment
  // or fallback to 3000 for local development
  const port = process.env.PORT || 3000;

  // Function to set up routes and middleware without actually binding to a port
  const setupApp = () => {
    log(`[DEV MODE] Server would start on port ${port}. Skipping actual socket binding.`);
    log(`Routes and middleware have been initialized in development mode.`);
    // Add any additional setup that would be required for the app to function
    // without actually binding to a socket
  };

  // Check if we're in development mode or local development is explicitly requested
  if (process.env.NODE_ENV === 'development' || process.env.LOCAL_DEV === 'true') {
    // Development mode - skip actual socket binding
    setupApp();
  } else {
    // Production mode (Render.com) - do normal socket binding
    server.listen({
      port,
      host: "0.0.0.0", // Bind to all interfaces (required for Render.com)
      reusePort: true,
    }, () => {
      log(`Server running on port ${port}`);
    });
  }
})();
