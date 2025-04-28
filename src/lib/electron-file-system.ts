import type {
	FileInfo,
	ElectronFileSystem as IElectronFileSystem,
} from "@/interfaces/FileSystem/FileSystem";

export class ElectronFileSystem implements IElectronFileSystem {
	private currentPath: string | null = null;
	private watchers: Map<string, () => void> = new Map();

	constructor() {
		console.log("ElectronFileSystem initialized");
	}

	setPath(path: string): void {
		this.currentPath = path;
		console.log("Set current path to:", path);
	}

	getFullPath(relativePath: string): string {
		if (!this.currentPath) {
			throw new Error("No folder selected");
		}

		// If relativePath is empty, return the current path
		if (!relativePath) return this.currentPath;

		// Handle absolute paths
		if (relativePath.startsWith("/")) {
			return relativePath;
		}

		// Combine current path with relative path
		return `${this.currentPath}/${relativePath}`;
	}

	async openFolder(): Promise<string | null> {
		if (!window.electron?.openFolder) {
			throw new Error("Electron API not available");
		}

		try {
			const result = await window.electron.openFolder();
			if (result.filePaths?.[0]) {
				this.setPath(result.filePaths[0]);
				return result.filePaths[0];
			}
			return null;
		} catch (err) {
			console.error("Error opening folder:", err);
			throw err;
		}
	}

	async listFiles(dirPath: string, recursive = false): Promise<FileInfo[]> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(dirPath);
		console.log("Listing files in path:", fullPath);

		return await window.electron.fileSystem.listFiles(fullPath, recursive);
	}

	async readFile(path: string): Promise<{ content: string; info: FileInfo }> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);
		return await window.electron.fileSystem.readFile(fullPath);
	}

	async writeFile(path: string, content: string): Promise<void> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);
		await window.electron.fileSystem.writeFile(fullPath, content);
	}

	async deleteFile(path: string): Promise<void> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);
		await window.electron.fileSystem.deleteFile(fullPath);
	}

	async createDirectory(dirPath: string): Promise<void> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(dirPath);
		await window.electron.fileSystem.createDirectory(fullPath);
	}

	async deleteDirectory(dirPath: string): Promise<void> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(dirPath);
		await window.electron.fileSystem.deleteDirectory(fullPath);
	}

	async moveFile(oldPath: string, newPath: string): Promise<void> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullOldPath = this.getFullPath(oldPath);
		const fullNewPath = this.getFullPath(newPath);
		await window.electron.fileSystem.moveFile(fullOldPath, fullNewPath);
	}

	async copyFile(sourcePath: string, destPath: string): Promise<void> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullSourcePath = this.getFullPath(sourcePath);
		const fullDestPath = this.getFullPath(destPath);
		await window.electron.fileSystem.copyFile(fullSourcePath, fullDestPath);
	}

	async exists(path: string): Promise<boolean> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);
		return await window.electron.fileSystem.exists(fullPath);
	}

	async isDirectory(path: string): Promise<boolean> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);
		return await window.electron.fileSystem.isDirectory(fullPath);
	}

	async getFileInfo(path: string): Promise<FileInfo> {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);
		return await window.electron.fileSystem.getFileInfo(fullPath);
	}

	watchChanges(
		path: string,
		callback: (changes: FileInfo[]) => void,
	): () => void {
		if (!window.electron?.fileSystem) {
			throw new Error("Electron API not available");
		}

		const fullPath = this.getFullPath(path);

		// Clean up any existing watcher for this path
		if (this.watchers.has(fullPath)) {
			this.watchers.get(fullPath)?.();
			this.watchers.delete(fullPath);
		}

		// Create new watcher
		const cleanup = window.electron.fileSystem.watchChanges(fullPath, callback);
		this.watchers.set(fullPath, cleanup);

		// Return cleanup function
		return () => {
			if (this.watchers.has(fullPath)) {
				this.watchers.get(fullPath)?.();
				this.watchers.delete(fullPath);
			}
		};
	}
}
