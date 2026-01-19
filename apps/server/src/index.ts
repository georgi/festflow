import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import express from "express";
import "dotenv/config";
import { createApiRouter } from "./api/router";
import { createRealtimeServer } from "./realtime";

const app = express();
app.disable("x-powered-by");

const port = Number(process.env.PORT ?? "3000");

app.use(express.json({ limit: "1mb" }));

const server = http.createServer(app);

server.on("error", (err) => {
  const anyErr = err as NodeJS.ErrnoException;
  if (anyErr.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Set PORT=3001 (or stop the other process) and retry.`
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});

const realtime = createRealtimeServer(server);
app.use("/api", createApiRouter({ broadcast: realtime.broadcast }));

async function main() {
  const serverDir = path.dirname(fileURLToPath(import.meta.url));

  if (process.env.NODE_ENV !== "production") {
    const webRoot = path.resolve(serverDir, "../../web");
    const vite = await (await import("vite")).createServer({
      root: webRoot,
      server: { middlewareMode: true },
      appType: "custom"
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res) => {
      try {
        const url = req.originalUrl;
        const indexHtmlPath = path.resolve(webRoot, "index.html");
        let html = await fs.readFile(indexHtmlPath, "utf-8");
        html = await vite.transformIndexHtml(url, html);
        res.status(200).setHeader("Content-Type", "text/html").end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        res.status(500).end((err as Error).stack ?? String(err));
      }
    });
  } else {
    const distDir = path.resolve(serverDir, "../../web/dist");
    app.use(express.static(distDir));
    app.get("*", async (_req, res) => {
      const indexHtmlPath = path.resolve(distDir, "index.html");
      res.status(200).setHeader("Content-Type", "text/html");
      res.end(await fs.readFile(indexHtmlPath, "utf-8"));
    });
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`FestFlow listening on http://0.0.0.0:${port} (${realtime.clientsCount()} ws clients)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
