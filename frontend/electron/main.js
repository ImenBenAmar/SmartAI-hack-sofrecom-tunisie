// @ts-check
const { app, BrowserWindow } = require("electron");
const path = require("path");

/** @type {BrowserWindow|null} */
let mainWindow = null;

const isDev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow && mainWindow.show());

  if (isDev) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    // In production, serve the Next.js build output via a local file server or a custom protocol.
    // This is a placeholder: you may set up next export or next start and then loadURL accordingly.
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
