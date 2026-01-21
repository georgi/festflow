// Preload script for Electron security
// Exposes controlled APIs to the renderer process

const { contextBridge } = require("electron");

// Expose platform info to the renderer
contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,
});
