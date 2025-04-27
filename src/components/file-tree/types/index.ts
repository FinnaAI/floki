import type { FileInfo } from "@/types/files";

export interface DirectoryNodeProps {
	directory: FileInfo;
	allFiles: FileInfo[];
	selectedFile: FileInfo | null;
	level: number;
	isIgnored: (path: string) => boolean;
	getFileStatus: (path: string) => string;
	showIgnoredFiles: boolean;
	onFileClick: (file: FileInfo) => void;
	onToggleSelect: (file: FileInfo) => void;
	isSelected: (file: FileInfo) => boolean;
	onCreateFile: (isDirectory: boolean, parentDir: string) => void;
	onCreateFolder: (isDirectory: boolean, parentDir: string) => void;
	setRenameTarget: (p: string | null) => void;
	setDraftName: (n: string) => void;
	renameTarget: string | null;
	draftName: string;
	draft: { parentDir: string; isDirectory: boolean } | null;
	commitDraft: () => void;
	cancelDraft: () => void;
}

export interface FileNodeProps {
	file: FileInfo;
	isSelected: boolean;
	isIgnored: boolean;
	fileStatus: string;
	onSelect: () => void;
	onToggleSelect: () => void;
	isChecked: boolean;
	onDelete: () => void;
	setRenameTarget: (p: string | null) => void;
	setDraftName: (n: string) => void;
	renameTarget: string | null;
	draftName: string;
}

export interface InlineEditorProps {
	value: string;
	onChange: (v: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
	className?: string;
}

export interface FileListProps {
	files: FileInfo[];
	selectedFile: FileInfo | null;
	currentPath: string;
	isIgnored: (path: string) => boolean;
	getFileStatus: (path: string) => string;
	showIgnoredFiles: boolean;
	onFileClick: (file: FileInfo) => void;
	onToggleSelect: (file: FileInfo) => void;
	isSelected: (file: FileInfo) => boolean;
	onCreateFile: (isDirectory: boolean, parentDir: string) => void;
	onCreateFolder: (isDirectory: boolean, parentDir: string) => void;
	onDeleteFile: (filePath: string) => void;
	draft: { parentDir: string; isDirectory: boolean } | null;
	renameTarget: string | null;
	draftName: string;
	setDraftName: (name: string) => void;
	commitDraft: () => void;
	cancelDraft: () => void;
	setRenameTarget: (p: string | null) => void;
}
