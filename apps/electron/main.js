const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { spawn, execSync } = require("child_process");
const http = require("http");

let mainWindow = null;
let serverProcess = null;

const PORT = 3000;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

function getResourcePath(...segments) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...segments);
  }
  return path.join(__dirname, "..", ...segments);
}

/**
 * Find the Node.js executable path.
 * Returns the path to node if found, or null if not available.
 */
function findNodePath() {
  // First, try using the PATH
  const nodeCmd = process.platform === "win32" ? "node.exe" : "node";
  
  try {
    // Try to get the actual path using 'which' (Unix) or 'where' (Windows)
    const whichCmd = process.platform === "win32" ? "where" : "which";
    const nodePath = execSync(`${whichCmd} ${nodeCmd}`, { encoding: "utf-8" }).trim().split("\n")[0];
    if (nodePath) {
      return nodePath;
    }
  } catch {
    // Command failed, node not in PATH
  }

  // Try common installation paths
  const commonPaths = process.platform === "win32"
    ? [
        "C:\\Program Files\\nodejs\\node.exe",
        "C:\\Program Files (x86)\\nodejs\\node.exe",
      ]
    : [
        "/usr/local/bin/node",
        "/usr/bin/node",
        "/opt/homebrew/bin/node",
      ];

  for (const p of commonPaths) {
    try {
      execSync(`"${p}" --version`, { encoding: "utf-8" });
      return p;
    } catch {
      // This path doesn't work
    }
  }

  return null;
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
    // Find Node.js executable
    const nodePath = findNodePath();
    if (!nodePath) {
      reject(new Error("Node.js is required but was not found. Please install Node.js and try again."));
      return;
    }

    // In packaged mode: resources/app/server/dist
    // In dev mode: ../server/dist
    const appRoot = getResourcePath(app.isPackaged ? "app" : "");
    const serverDistPath = path.join(appRoot, "server", "dist");
    const serverEntry = path.join(serverDistPath, "index.js");

    // Database stored in user data directory for persistence
    const userDataDir = app.getPath("userData");
    const dbPath = path.join(userDataDir, "festflow.db");

    const env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: PORT.toString(),
      DATABASE_URL: `file:${dbPath}`,
    };

    serverProcess = spawn(nodePath, [serverEntry], {
      env,
      cwd: serverDistPath,
      stdio: ["ignore", "pipe", "pipe"],
    });

    serverProcess.stdout?.on("data", (data) => {
      console.log(`[Server] ${data.toString().trim()}`);
    });

    serverProcess.stderr?.on("data", (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });

    serverProcess.on("error", (err) => {
      console.error("Failed to start server:", err);
      reject(err);
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
    serverProcess.kill();
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
