import path from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, Menu, app } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import serve from "electron-serve";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set app name
app.name = "Floki";

const appServe = app.isPackaged
	? serve({
			directory: path.join(__dirname, "../out"),
		})
	: null;

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		// titleBarStyle: "hiddenInset",
		title: "Floki",
		icon: path.resolve(process.cwd(), "build", "icon.png"),
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

// Custom Mac menu
if (process.platform === "darwin") {
	const template: MenuItemConstructorOptions[] = [
		{
			label: app.name,
			submenu: [
				{ role: "about", label: `About ${app.name}` },
				{ type: "separator" },
				{ role: "services" },
				{ type: "separator" },
				{ role: "hide", label: `Hide ${app.name}` },
				{ role: "hideOthers" },
				{ role: "unhide" },
				{ type: "separator" },
				{ role: "quit", label: `Quit ${app.name}` },
			],
		},
		{ role: "editMenu" },
		{ role: "viewMenu" },
		{ role: "windowMenu" },
		{
			role: "help",
			submenu: [
				{
					label: "Learn More",
					click: async () => {
						const { shell } = await import("electron");
						await shell.openExternal("https://finna.ai");
					},
				},
			],
		},
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Set app metadata
app.setAboutPanelOptions({
	applicationName: app.name,
	applicationVersion: app.getVersion(),
	version: process.env.npm_package_version || "0.1.0",
	copyright: "© 2025 Finna AI",
	website: "https://finna.ai",
	iconPath: path.join(process.cwd(), "build", "icon.png"),
});

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
