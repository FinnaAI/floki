import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app } from "electron";
import serve from "electron-serve";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, "../out"),
    })
  : null;

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (app.isPackaged) {
    if (appServe) {
      appServe(mainWindow).then(() => {
        mainWindow?.loadURL("app://-");
      });
    }
  } else {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();

    // Hot reload on file changes
    mainWindow.webContents.on("did-fail-load", () => {
      mainWindow?.webContents.reloadIgnoringCache();
    });

    // Watch for changes in development
    if (process.env.NODE_ENV !== "production") {
      mainWindow.webContents.on("did-finish-load", () => {
        mainWindow?.webContents.on("devtools-reload-page", () => {
          mainWindow?.webContents.reloadIgnoringCache();
        });
      });
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("ready", () => {
  createWindow();
});

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
