export interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date;
	handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
	deleted?: boolean;
	isLarge?: boolean;
}

export interface FileDiff {
	originalContent: string;
	newContent: string;
	filePath: string;
	diff: string;
}
