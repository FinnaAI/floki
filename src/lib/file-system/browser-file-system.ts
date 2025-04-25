import type {
	FileInfo,
	FileSystem,
	FileSystemOptions,
} from "@/interfaces/FileSystem/FileSystem";

// Extend Window interface to include showDirectoryPicker
declare global {
	interface Window {
		showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
	}
}

export class BrowserFileSystem implements FileSystem {
	private worker: Worker | null = null;
	folderHandle: FileSystemDirectoryHandle | null = null;
	private options: FileSystemOptions;

	constructor(options: FileSystemOptions = {}) {
		this.options = {
			pollInterval: 2000,
			...options,
		};
	}

	private initWorker() {
		if (this.worker) return;

		this.worker = new Worker("/workers/workers/file-system.worker.js", {
			type: "module",
		});

		if (this.options.pollInterval) {
			this.worker.postMessage({
				type: "setPollInterval",
				pollInterval: this.options.pollInterval,
			});
		}
	}

	async openFolder(): Promise<FileSystemDirectoryHandle> {
		this.initWorker();
		const handle = await window.showDirectoryPicker();
		this.folderHandle = handle;

		if (this.worker) {
			this.worker.postMessage({
				type: "setFolder",
				handle,
			});
		}

		return handle;
	}

	async listFiles(path: string, recursive = false): Promise<FileInfo[]> {
		if (!this.folderHandle || !this.worker) {
			throw new Error("No folder selected");
		}

		return new Promise((resolve, reject) => {
			const messageId = crypto.randomUUID();
			const worker = this.worker;

			if (!worker) {
				reject(new Error("Worker not initialized"));
				return;
			}

			const handleMessage = ({ data }: MessageEvent) => {
				if (data.messageId === messageId) {
					worker.removeEventListener("message", handleMessage);
					if (data.error) {
						reject(new Error(data.error));
					} else {
						// Files from worker don't include handles anymore
						resolve(data.files);
					}
				}
			};

			worker.addEventListener("message", handleMessage);
			worker.postMessage({
				type: "listFiles",
				path,
				recursive,
				messageId,
			});
		});
	}

	async readFile(path: string): Promise<{ content: string; info: FileInfo }> {
		if (!this.folderHandle) {
			throw new Error("No folder selected");
		}

		try {
			const handle = await this.getFileHandle(path);
			const file = await handle.getFile();
			const content = await file.text();

			return {
				content,
				info: {
					name: handle.name,
					path,
					isDirectory: false,
					size: file.size,
					lastModified: new Date(file.lastModified),
					handle, // Only include handle here, not in entire tree
				},
			};
		} catch (error) {
			console.error(`Error reading file ${path}:`, error);
			throw new Error(
				`Failed to read file: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	async writeFile(path: string, content: string): Promise<FileInfo> {
		if (!this.folderHandle) {
			throw new Error("No folder selected");
		}

		const handle = await this.getFileHandle(path, true);
		const writable = await handle.createWritable();
		await writable.write(content);
		await writable.close();

		const file = await handle.getFile();
		return {
			name: handle.name,
			path,
			isDirectory: false,
			size: file.size,
			lastModified: new Date(file.lastModified),
			handle,
		};
	}

	watchChanges(
		path: string,
		callback: (changes: FileInfo[]) => void,
	): () => void {
		if (!this.folderHandle || !this.worker) {
			throw new Error("No folder selected");
		}

		const messageId = crypto.randomUUID();
		const worker = this.worker;

		const handleMessage = ({
			data,
		}: MessageEvent<{
			type: string;
			messageId: string;
			changes: FileInfo[];
		}>) => {
			if (data.messageId === messageId && data.type === "changes") {
				callback(data.changes);
			}
		};

		worker.addEventListener("message", handleMessage);
		worker.postMessage({
			type: "watchChanges",
			path,
			messageId,
		});

		return () => {
			worker.removeEventListener("message", handleMessage);
			worker.postMessage({
				type: "stopWatching",
				messageId: `cleanup_${messageId}`,
			});
		};
	}

	private async getFileHandle(
		path: string,
		create = false,
	): Promise<FileSystemFileHandle> {
		if (!this.folderHandle) {
			throw new Error("No folder selected");
		}

		let current = this.folderHandle;

		// Remove the folder name from the path if it's included
		// This is a common issue when paths include the root folder name
		const folderName = this.folderHandle.name;
		let relativePath = path;

		// If the path starts with the folder name, remove it
		if (path.startsWith(`${folderName}/`)) {
			relativePath = path.slice(folderName.length + 1);
		}

		const parts = relativePath.split("/").filter(Boolean);

		if (parts.length === 0) {
			throw new Error("Invalid file path");
		}

		// Navigate through directories
		const dirParts = parts.slice(0, -1);
		for (const part of dirParts) {
			try {
				current = await current.getDirectoryHandle(part, { create });
			} catch (err) {
				console.error(`Error getting directory ${part}:`, err);
				throw new Error(`Directory not found: ${part}`);
			}
		}

		// Get the file handle
		const fileName = parts[parts.length - 1];
		if (!fileName) {
			throw new Error("Invalid file name");
		}

		try {
			return await current.getFileHandle(fileName, { create });
		} catch (err) {
			console.error(`Error getting file ${fileName}:`, err);
			throw new Error(`File not found: ${fileName}`);
		}
	}
}
