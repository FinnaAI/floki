"use client";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useFileStore } from "@/store/file-store";
import type { FileInfo } from "@/types/files";
import { FilePlus, FolderPlus } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { DirectoryNode } from "./directory-node";
import { FileNode } from "./file-node";
import { InlineEditor } from "./inline-editor";

export const FileList = memo(
	({
		files,
		currentPath,
		selectedFile,
		isIgnored,
		getFileStatus,
		showIgnoredFiles,
		handleFileClick,
		toggleFileSelection,
		isFileSelected,
		draft,
		draftName,
		commitDraft,
		cancelDraft,
		setRenameTarget,
		setDraftName,
		renameTarget,
		onCreateFile,
		onCreateFolder,
	}: {
		files: FileInfo[];
		currentPath: string;
		selectedFile: FileInfo | null;
		isIgnored: (path: string) => boolean;
		getFileStatus: (path: string) => string;
		showIgnoredFiles: boolean;
		handleFileClick: (file: FileInfo) => void;
		toggleFileSelection: (file: FileInfo) => void;
		isFileSelected: (file: FileInfo) => boolean;
		draft: { parentDir: string; isDirectory: boolean } | null;
		draftName: string;
		commitDraft: () => void;
		cancelDraft: () => void;
		setRenameTarget: (path: string | null) => void;
		setDraftName: (name: string) => void;
		renameTarget: string | null;
		onCreateFile: (isDirectory: boolean, parentDir?: string) => void;
		onCreateFolder: (isDirectory: boolean, parentDir?: string) => void;
	}) => {
		// Create stable callbacks for menu item handlers
		const handleCreateFolder = useCallback(() => {
			onCreateFolder(true, currentPath);
		}, [onCreateFolder, currentPath]);

		const handleCreateFile = useCallback(() => {
			onCreateFile(false, currentPath);
		}, [onCreateFile, currentPath]);

		// Memoize the context menu to prevent re-creation on every render
		const contextMenuComponent = useMemo(
			() => (
				<ContextMenu>
					<ContextMenuTrigger>
						<div className="h-16 w-full" />
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem onClick={handleCreateFolder}>
							<FolderPlus className="mr-2 h-4 w-4" />
							New Folder
						</ContextMenuItem>
						<ContextMenuItem onClick={handleCreateFile}>
							<FilePlus className="mr-2 h-4 w-4" />
							New File
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			),
			[handleCreateFolder, handleCreateFile],
		);

		// Define the TreeNode type first to use in the selector
		type TreeNode = {
			children: Record<string, TreeNode>;
			file?: FileInfo;
		};

		// Get root directories and files from the tree using a stable selector with proper types
		// We need to use useMemo to ensure the selector function is stable
		const selector = useMemo(
			() => (state: { tree: TreeNode | null }) => ({
				tree: state.tree,
				// Don't select any other state properties that might change frequently
			}),
			[], // Empty dependency array means this selector function never changes
		);

		// Use the stable selector to get only the tree data
		const { tree } = useFileStore(useShallow(selector));

		// Process the tree data with useMemo to avoid recalculating on every render
		const { rootDirs, rootFiles } = useMemo(() => {
			// If we don't have tree data yet, return empty lists
			if (!tree) {
				return { rootDirs: [], rootFiles: [] };
			}

			const dirItems: FileInfo[] = [];
			const fileItems: FileInfo[] = [];

			// Loop through the root children and organize into dirs and files
			for (const [name, node] of Object.entries(tree.children)) {
				// Cast node to the proper type
				const typedNode = node as TreeNode;

				// Skip ignored files unless showIgnoredFiles is true
				if (
					typedNode.file &&
					!showIgnoredFiles &&
					isIgnored(typedNode.file.path)
				) {
					continue;
				}

				// Check if this is a top-level item in the current path
				// For non-empty currentPath, we need to check if it's an immediate child
				if (currentPath) {
					// For non-root paths, the tree structure already handles this correctly
					// We only need to check if this is an immediate child of the current path
					const pathParts = typedNode.file?.path.split("/") || [];
					const currentPathParts = currentPath.split("/");

					// Skip if not a direct child of current path
					if (pathParts.length !== currentPathParts.length + 1) {
						continue;
					}
				}

				if (typedNode.file) {
					if (typedNode.file.isDirectory) {
						dirItems.push(typedNode.file);
					} else {
						fileItems.push(typedNode.file);
					}
				}
			}

			// Sort alphabetically
			dirItems.sort((a, b) => a.name.localeCompare(b.name));
			fileItems.sort((a, b) => a.name.localeCompare(b.name));

			return { rootDirs: dirItems, rootFiles: fileItems };
		}, [tree, currentPath, showIgnoredFiles, isIgnored]);

		// Check if draft is targeting the current path
		const showDraft = draft && draft.parentDir === currentPath;

		return (
			<div className="space-y-0.5 p-2">
				{showDraft && (
					<div className="flex items-center gap-1 rounded-md px-2 py-1.5">
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
						onFileClick={handleFileClick}
						onToggleSelect={toggleFileSelection}
						isSelected={isFileSelected}
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

				{rootFiles.map((file) => (
					<FileNode
						key={file.path}
						file={file}
						isSelected={selectedFile?.path === file.path}
						isIgnored={isIgnored(file.path)}
						fileStatus={getFileStatus(file.path)}
						onSelect={() => handleFileClick(file)}
						onToggleSelect={() => toggleFileSelection(file)}
						isChecked={
							typeof isFileSelected === "function"
								? isFileSelected(file)
								: false
						}
						onDelete={() => useFileStore.getState().deleteFile(file.path)}
						setRenameTarget={setRenameTarget}
						setDraftName={setDraftName}
						renameTarget={renameTarget}
						draftName={draftName}
					/>
				))}

				{!showDraft && contextMenuComponent}
			</div>
		);
	},
);

FileList.displayName = "FileList";
