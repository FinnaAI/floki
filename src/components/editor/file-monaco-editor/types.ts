import type { OnMount } from "@monaco-editor/react";

export interface FileInfo {
	name: string;
	path: string;
	isDirectory: boolean;
	size: number;
	lastModified: Date | string;
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

export type GitFileStatus = "modified" | "added" | "deleted" | "untracked" | null;

export type DiffEditorType = {
	getOriginalEditor: () => Parameters<OnMount>[0];
	getModifiedEditor: () => Parameters<OnMount>[0];
};
