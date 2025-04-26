export interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date | string;
	handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
	deleted?: boolean;
	isLarge?: boolean;
}

export interface FileDiff {
	oldContent: string;
	newContent: string;
	hunks: {
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		lines: string[];
	}[];
}
