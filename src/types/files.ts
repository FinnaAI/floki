export interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	lastModified: Date;
	size: number;
  }

export interface FileDiff {
	oldContent: string;
	newContent: string;
	hunks: Array<{
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		lines: string[];
	}>;
}
