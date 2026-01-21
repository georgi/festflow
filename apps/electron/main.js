const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
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

function getUserDataPath(...segments) {
  return path.join(app.getPath("userData"), ...segments);
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
    // In packaged mode: resources/app/server/dist
    // In dev mode: ../server/dist
    const appRoot = getResourcePath(app.isPackaged ? "app" : "");
    const serverDistPath = path.join(appRoot, "server", "dist");
    const serverEntry = path.join(serverDistPath, "index.js");

    // Database stored in user data directory for persistence
    const dbPath = getUserDataPath("festflow.db");

    const env = {
      ...process.env,
      NODE_ENV: "production",
      PORT: PORT.toString(),
      DATABASE_URL: `file:${dbPath}`,
    };

    // Spawn node with the server entry point
    // We rely on node being available on the system PATH
    const nodeCmd = process.platform === "win32" ? "node.exe" : "node";

    serverProcess = spawn(nodeCmd, [serverEntry], {
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
