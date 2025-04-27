import { contextBridge, ipcRenderer } from "electron";

// File info type definition for TypeScript
interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date;
	deleted?: boolean;
}

type Channel = string;
type Callback = (...args: unknown[]) => void;

// Expose general IPC API
contextBridge.exposeInMainWorld("electronAPI", {
	on: (channel: Channel, callback: Callback) => {
		ipcRenderer.on(channel, callback);
	},
	send: (channel: Channel, args: unknown) => {
		ipcRenderer.send(channel, args);
	},
});

// Expose specific file system APIs
contextBridge.exposeInMainWorld("electron", {
	openFolder: async () => {
		return await ipcRenderer.invoke("fs-open-folder");
	},
	fileSystem: {
		listFiles: async (path: string, recursive = false) => {
			return await ipcRenderer.invoke("fs-list-files", { path, recursive });
		},

		readFile: async (path: string) => {
			return await ipcRenderer.invoke("fs-read-file", { path });
		},

		writeFile: async (path: string, content: string) => {
			return await ipcRenderer.invoke("fs-write-file", { path, content });
		},

		deleteFile: async (path: string) => {
			return await ipcRenderer.invoke("fs-delete-file", { path });
		},

		createDirectory: async (path: string) => {
			return await ipcRenderer.invoke("fs-create-directory", { path });
		},

		deleteDirectory: async (path: string) => {
			return await ipcRenderer.invoke("fs-delete-directory", { path });
		},

		moveFile: async (oldPath: string, newPath: string) => {
			return await ipcRenderer.invoke("fs-move-file", { oldPath, newPath });
		},

		copyFile: async (sourcePath: string, destPath: string) => {
			return await ipcRenderer.invoke("fs-copy-file", { sourcePath, destPath });
		},

		exists: async (path: string) => {
			return await ipcRenderer.invoke("fs-exists", { path });
		},

		isDirectory: async (path: string) => {
			return await ipcRenderer.invoke("fs-is-directory", { path });
		},

		getFileInfo: async (path: string) => {
			return await ipcRenderer.invoke("fs-get-file-info", { path });
		},

		watchChanges: (path: string, callback: (changes: FileInfo[]) => void) => {
			const id = `fs-watch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

			ipcRenderer.on(id, (_event, changes) => {
				callback(changes);
			});

			ipcRenderer.invoke("fs-watch-changes", { path, id });

			return () => {
				ipcRenderer.invoke("fs-unwatch-changes", { id });
				ipcRenderer.removeAllListeners(id);
			};
		},
	},
});
