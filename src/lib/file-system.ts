import type {
	FileInfo,
	ElectronFileSystem as IElectronFileSystem,
	WebFileSystem as IWebFileSystem,
} from "@/interfaces/FileSystem/FileSystem";
import { isElectron } from "./utils";

class WebFileSystem implements IWebFileSystem {
	folderHandle: FileSystemDirectoryHandle | null = null;
	private worker: Worker | null = null;

	constructor() {
		if (typeof window !== "undefined") {
			this.worker = new Worker("/workers/workers/file-system.worker.js", {
				type: "module",
			});
		}
	}

	async openFolder(): Promise<FileSystemDirectoryHandle> {
		try {
			const handle = await window.showDirectoryPicker();
			this.folderHandle = handle;

			if (this.worker) {
				this.worker.postMessage({
					type: "setFolder",
					handle,
					messageId: "initial",
				});
			}

			return handle;
		} catch (error) {
			console.error("Error opening folder:", error);
			throw error;
		}
	}

	async listFiles(dirPath: string, recursive = false): Promise<FileInfo[]> {
		if (!this.folderHandle) {
			throw new Error("No folder selected");
		}

		return new Promise((resolve, reject) => {
			if (!this.worker) {
				reject(new Error("Worker not initialized"));
				return;
			}

			const messageId = Math.random().toString(36).substring(7);
			const handler = (event: MessageEvent) => {
				const { type, files, error, messageId: responseId } = event.data;
				if (responseId !== messageId) return;

				this.worker?.removeEventListener("message", handler);

				if (type === "error") {
					reject(new Error(error));
				} else if (type === "fileList") {
					resolve(files);
				}
			};

			this.worker.addEventListener("message", handler);
			this.worker.postMessage({
				type: "listFiles",
				path: dirPath,
				recursive,
				messageId,
			});
		});
	}

	async readFile(path: string): Promise<{ content: string; info: FileInfo }> {
		if (!this.folderHandle) {
			throw new Error("No folder selected");
		}

		// Navigate to the file through the directory structure
		const parts = path.split("/").filter(Boolean);
		let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle =
			this.folderHandle;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!part) continue;
			currentHandle = await (
				currentHandle as FileSystemDirectoryHandle
			).getDirectoryHandle(part);
		}

		const fileName = parts[parts.length - 1];
		if (!fileName) {
			throw new Error("Invalid file path");
		}
		const fileHandle = await (
			currentHandle as FileSystemDirectoryHandle
		).getFileHandle(fileName);
		const file = await fileHandle.getFile();
		const content = await file.text();

		const info: FileInfo = {
			name: file.name,
			path,
			isDirectory: false,
			size: file.size,
			lastModified: new Date(file.lastModified),
			handle: fileHandle,
		};

		return { content, info };
	}

	async writeFile(path: string, content: string): Promise<FileInfo> {
		if (!this.folderHandle) {
			throw new Error("No folder selected");
		}

		// Navigate to the file through the directory structure
		const parts = path.split("/").filter(Boolean);
		let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle =
			this.folderHandle;

		// Create directories if they don't exist
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!part) continue;
			currentHandle = await (
				currentHandle as FileSystemDirectoryHandle
			).getDirectoryHandle(part, { create: true });
		}

		const fileName = parts[parts.length - 1];
		if (!fileName) {
			throw new Error("Invalid file path");
		}
		const fileHandle = await (
			currentHandle as FileSystemDirectoryHandle
		).getFileHandle(fileName, { create: true });
		const writable = await fileHandle.createWritable();
		await writable.write(content);
		await writable.close();

		const file = await fileHandle.getFile();
		return {
			name: file.name,
			path,
			isDirectory: false,
			size: file.size,
			lastModified: new Date(file.lastModified),
			handle: fileHandle,
		};
	}

	watchChanges(
		path: string,
		callback: (changes: FileInfo[]) => void,
	): () => void {
		if (!this.worker) {
			throw new Error("Worker not initialized");
		}

		const messageId = Math.random().toString(36).substring(7);
		const handler = (event: MessageEvent) => {
			const { type, changes } = event.data;
			if (type === "changes") {
				callback(changes);
			}
		};

		this.worker.addEventListener("message", handler);
		this.worker.postMessage({
			type: "watchChanges",
			path,
			messageId,
		});

		return () => {
			this.worker?.removeEventListener("message", handler);
			this.worker?.postMessage({
				type: "stopWatching",
				messageId: `cleanup_${messageId}`,
			});
		};
	}
}

class ElectronFileSystem implements IElectronFileSystem {
	private currentPath: string | null = null;
	private worker: Worker | null = null;

	constructor() {
		if (typeof window !== "undefined") {
			this.worker = new Worker("/workers/workers/file-system.worker.js", {
				type: "module",
			});
		}
	}

	setPath(path: string) {
		this.currentPath = path;
		this.worker?.postMessage({
			type: "setFolder",
			path,
			messageId: "initial",
		});
	}

	async openFolder(): Promise<string | null> {
		if (!window.electron?.openFolder) {
			throw new Error("Electron API not available");
		}
		const result = await window.electron.openFolder();
		if (result.filePaths?.[0]) {
			this.setPath(result.filePaths[0]);
			return result.filePaths[0];
		}
		return null;
	}

	async listFiles(dirPath: string, recursive = false): Promise<FileInfo[]> {
		return new Promise((resolve, reject) => {
			if (!this.worker) {
				reject(new Error("Worker not initialized"));
				return;
			}

			const messageId = Math.random().toString(36).substring(7);
			const handler = (event: MessageEvent) => {
				const { type, files, error, messageId: responseId } = event.data;
				if (responseId !== messageId) return;

				this.worker?.removeEventListener("message", handler);

				if (type === "error") {
					reject(new Error(error));
				} else if (type === "fileList") {
					resolve(files);
				}
			};

			this.worker.addEventListener("message", handler);
			this.worker.postMessage({
				type: "listFiles",
				path: dirPath,
				recursive,
				messageId,
			});
		});
	}

	async readFile(path: string): Promise<{ content: string; info: FileInfo }> {
		return new Promise((resolve, reject) => {
			if (!this.worker) {
				reject(new Error("Worker not initialized"));
				return;
			}

			const messageId = Math.random().toString(36).substring(7);
			const handler = (event: MessageEvent) => {
				const {
					type,
					content,
					info,
					error,
					messageId: responseId,
				} = event.data;
				if (responseId !== messageId) return;

				this.worker?.removeEventListener("message", handler);

				if (type === "error") {
					reject(new Error(error));
				} else if (type === "fileContent") {
					resolve({ content, info });
				}
			};

			this.worker.addEventListener("message", handler);
			this.worker.postMessage({
				type: "readFile",
				path,
				messageId,
			});
		});
	}

	async writeFile(path: string, content: string): Promise<FileInfo> {
		return new Promise((resolve, reject) => {
			if (!this.worker) {
				reject(new Error("Worker not initialized"));
				return;
			}

			const messageId = Math.random().toString(36).substring(7);
			const handler = (event: MessageEvent) => {
				const { type, info, error, messageId: responseId } = event.data;
				if (responseId !== messageId) return;

				this.worker?.removeEventListener("message", handler);

				if (type === "error") {
					reject(new Error(error));
				} else if (type === "fileWritten") {
					resolve(info);
				}
			};

			this.worker.addEventListener("message", handler);
			this.worker.postMessage({
				type: "writeFile",
				path,
				content,
				messageId,
			});
		});
	}

	watchChanges(
		path: string,
		callback: (changes: FileInfo[]) => void,
	): () => void {
		if (!this.worker) {
			throw new Error("Worker not initialized");
		}

		const messageId = Math.random().toString(36).substring(7);
		const handler = (event: MessageEvent) => {
			const { type, changes } = event.data;
			if (type === "changes") {
				callback(changes);
			}
		};

		this.worker.addEventListener("message", handler);
		this.worker.postMessage({
			type: "watchChanges",
			path,
			messageId,
		});

		return () => {
			this.worker?.removeEventListener("message", handler);
			this.worker?.postMessage({
				type: "stopWatching",
				messageId: `cleanup_${messageId}`,
			});
		};
	}
}

// Declare the electron API and File System Access API on window
declare global {
	interface Window {
		electron?: {
			openFolder(): Promise<{ filePaths: string[] }>;
		};
		process?: {
			type?: string;
		};
		showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
	}
}

export function createFileSystem() {
	if (isElectron()) {
		return new ElectronFileSystem();
	}
	return new WebFileSystem();
}
