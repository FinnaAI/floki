"use client";

import { Button } from "@/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useFileStore } from "@/store/file-store";
import { FilePlus, FolderPlus } from "lucide-react";
import { memo, useMemo } from "react";
import type { FileListProps } from "../types";
import { DirectoryNode } from "./directory-node";
import { FileNode } from "./file-node";
import { InlineEditor } from "./inline-editor";

// Helper to get parent path
const getParentPath = (filePath: string): string => {
	const idx = filePath.lastIndexOf("/");
	if (idx === -1) return "";
	return filePath.substring(0, idx);
};

export const FileList = memo(
	({
		files,
		selectedFile,
		currentPath,
		isIgnored,
		getFileStatus,
		showIgnoredFiles,
		onFileClick,
		onToggleSelect,
		isSelected,
		onCreateFile,
		onCreateFolder,
		onDeleteFile,
		draft,
		renameTarget,
		draftName,
		setDraftName,
		commitDraft,
		cancelDraft,
		setRenameTarget,
	}: FileListProps) => {
		const { rootDirs, rootFiles } = useMemo(() => {
			const rootDirs: typeof files = [];
			const rootFiles: typeof files = [];

			for (const file of files) {
				// skip parent directory placeholder ".."
				if (file.name === "..") continue;

				// Skip ignored files unless showIgnoredFiles is true
				if (!showIgnoredFiles && isIgnored(file.path)) continue;

				const parent = getParentPath(file.path);
				const isTopLevel = parent === currentPath || parent === "";

				if (isTopLevel) {
					if (file.isDirectory) {
						rootDirs.push(file);
					} else {
						rootFiles.push(file);
					}
				}
			}

			// Sort alphabetically (folders first already guaranteed by push order)
			rootDirs.sort((a, b) => a.name.localeCompare(b.name));
			rootFiles.sort((a, b) => a.name.localeCompare(b.name));

			return { rootDirs, rootFiles };
		}, [files, currentPath, isIgnored, showIgnoredFiles]);

		const showDraft =
			draft &&
			(draft.parentDir === currentPath ||
				(currentPath === "" && draft.parentDir === ""));

		return (
			<div className="animate-[fadeIn_0.1s_ease-out] justify-start space-y-0.5">
				{/* Root level create buttons */}
				<ContextMenu>
					<ContextMenuTrigger className="block h-8 w-full">
						<div className="hover:!bg-neutral-700/50 flex items-center justify-between rounded-md px-2 py-1.5">
							<span className="text-neutral-400 text-sm">Project Root</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-5 w-5"
								onClick={(e) => {
									e.stopPropagation();
									useFileStore.getState().refreshDirectory();
								}}
								title="Refresh file tree"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="h-3.5 w-3.5"
								>
									<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
									<path d="M21 3v5h-5" />
									<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
									<path d="M8 16H3v5" />
								</svg>
							</Button>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem
							onClick={() => {
								console.log(
									"Root context menu - creating folder in:",
									currentPath,
								);
								onCreateFolder(true, currentPath);
							}}
						>
							<FolderPlus className="mr-2 h-4 w-4" />
							New Folder
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => {
								console.log(
									"Root context menu - creating file in:",
									currentPath,
								);
								onCreateFile(false, currentPath);
							}}
						>
							<FilePlus className="mr-2 h-4 w-4" />
							New File
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>

				{/* Show draft item at the current level */}
				{showDraft && (
					<div className="flex items-center gap-1 rounded-md bg-neutral-700/20 px-2 py-1.5">
						{draft.isDirectory ? (
							<FolderPlus className="h-4 w-4 text-amber-500" />
						) : (
							<FilePlus className="h-4 w-4" />
						)}
						<InlineEditor
							key={`draft-${currentPath}`}
							value={draftName}
							onChange={setDraftName}
							onConfirm={commitDraft}
							onCancel={cancelDraft}
							className="flex-1"
						/>
					</div>
				)}

				{/* Directories */}
				{rootDirs.map((dir) => (
					<DirectoryNode
						key={dir.path}
						directory={dir}
						allFiles={files}
						selectedFile={selectedFile}
						level={0}
						isIgnored={isIgnored}
						getFileStatus={getFileStatus}
						showIgnoredFiles={showIgnoredFiles}
						onFileClick={onFileClick}
						onToggleSelect={onToggleSelect}
						isSelected={isSelected}
						onCreateFile={onCreateFile}
						onCreateFolder={onCreateFolder}
						setRenameTarget={setRenameTarget}
						setDraftName={setDraftName}
						renameTarget={renameTarget}
						draftName={draftName}
						draft={draft}
						commitDraft={commitDraft}
						cancelDraft={cancelDraft}
					/>
				))}
				{/* Files */}
				{rootFiles.map((file) => (
					<FileNode
						key={file.path}
						file={file}
						isSelected={selectedFile?.path === file.path}
						isIgnored={isIgnored(file.path)}
						fileStatus={getFileStatus(file.path)}
						onSelect={() => onFileClick(file)}
						onToggleSelect={() => onToggleSelect(file)}
						isChecked={isSelected(file)}
						onDelete={() => onDeleteFile(file.path)}
						setRenameTarget={setRenameTarget}
						setDraftName={setDraftName}
						renameTarget={renameTarget}
						draftName={draftName}
					/>
				))}
			</div>
		);
	},
);
FileList.displayName = "FileList";
