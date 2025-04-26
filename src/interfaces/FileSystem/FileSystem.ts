export interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date;
	handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
	deleted?: boolean;
}

// Base interface with common methods
export interface BaseFileSystem {
	listFiles: (dirPath: string, recursive?: boolean) => Promise<FileInfo[]>;
	readFile: (filePath: string) => Promise<{ content: string; info: FileInfo }>;
	writeFile: (filePath: string, content: string) => Promise<void>;
	deleteFile: (filePath: string) => Promise<void>;
	createDirectory: (dirPath: string) => Promise<void>;
	deleteDirectory: (dirPath: string) => Promise<void>;
	moveFile: (oldPath: string, newPath: string) => Promise<void>;
	copyFile: (sourcePath: string, destPath: string) => Promise<void>;
	exists: (path: string) => Promise<boolean>;
	isDirectory: (path: string) => Promise<boolean>;
	getFileInfo: (path: string) => Promise<FileInfo>;
	watchChanges?(
		path: string,
		callback: (changes: FileInfo[]) => void,
	): () => void;
}

// Web-specific interface
export interface WebFileSystem extends BaseFileSystem {
	folderHandle: FileSystemDirectoryHandle | null;
	openFolder: () => Promise<FileSystemDirectoryHandle>;
}

// Electron-specific interface
export interface ElectronFileSystem extends BaseFileSystem {
	setPath(path: string): void;
	openFolder(): Promise<string | null>;
}

// Union type for the file system
export type FileSystem = WebFileSystem | ElectronFileSystem;

// Type guards
export function isWebFileSystem(fs: unknown): fs is WebFileSystem {
	return typeof fs === "object" && fs !== null && "folderHandle" in fs;
}

export function isElectronFileSystem(fs: unknown): fs is ElectronFileSystem {
	return typeof fs === "object" && fs !== null && "setPath" in fs;
}

export interface FileSystemOptions {
	basePath?: string;
	pollInterval?: number; // For browser file system
	allowedPaths?: string[]; // For server file system
	excludePatterns?: string[]; // For both
}
