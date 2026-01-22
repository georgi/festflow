const { app, BrowserWindow, dialog, utilityProcess } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

let mainWindow = null;
let serverProcess = null;

const PORT = 3000;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

function getServerRoot() {
  // Packaged: <resources>/app/server
  // Dev: <repo>/apps/server
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app", "server");
  }
  return path.join(__dirname, "..", "server");
}

function resolveServerEntry(serverRoot) {
  const candidates = [
    path.join(serverRoot, "dist", "index.js"),
    path.join(serverRoot, "index.js"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Server entry not found. Looked for: ${candidates.join(", ")}`
  );
}

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", retry);
    }

    function retry() {
      if (Date.now() - startTime >= timeout) {
        reject(new Error("Server failed to start within timeout"));
      } else {
        setTimeout(check, 200);
      }
    }

    check();
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverRoot = getServerRoot();
    let serverEntry = null;
    try {
      serverEntry = resolveServerEntry(serverRoot);
    } catch (err) {
      reject(err);
      return;
    }

    // Database stored in user data directory for persistence
    const userDataDir = app.getPath("userData");
    const dbPath = path.join(userDataDir, "festflow.db");

    const env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: PORT.toString(),
      DATABASE_URL: `file:${dbPath}`,
    };

    try {
      serverProcess = utilityProcess.fork(serverEntry, [], {
        env,
        cwd: serverRoot,
        stdio: "pipe",
      });
    } catch (err) {
      reject(err);
      return;
    }

    serverProcess.stdout?.on("data", (data) => {
      console.log(`[Server] ${data.toString().trim()}`);
    });

    serverProcess.stderr?.on("data", (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });

    serverProcess.on("exit", (code) => {
      console.log(`Server exited with code ${code}`);
      serverProcess = null;
    });

    // Wait for server to be ready
    waitForServer(SERVER_URL)
      .then(resolve)
      .catch(reject);
  });
}

function stopServer() {
  if (serverProcess) {
    try {
      serverProcess.kill();
    } catch {
      // ignore
    }
    serverProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log("Starting FestFlow server...");
    await startServer();
    console.log("Server started successfully");
    createWindow();
  } catch (err) {
    console.error("Failed to start server:", err);
    await dialog.showMessageBox({
      type: "error",
      title: "FestFlow Error",
      message: "Failed to start the server",
      detail: err.message || String(err),
    });
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopServer();
});
