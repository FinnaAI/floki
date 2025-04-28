"use client";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { getFileIcon } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { useDirectoryTreeStore } from "@/store/directory-tree-store";
import { useFileStore } from "@/store/file-store";
import { useFileTreeStore } from "@/store/file-tree-store";
import { selectFileTreeHandlers } from "@/store/file-tree-store";
import type { FileInfo } from "@/types/files";
import {
	ChevronRight,
	FilePlus,
	Folder,
	FolderOpen,
	FolderPlus,
	Pencil,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { DirectoryNodeProps } from "../types";
import { FileNode } from "./file-node";
import { InlineEditor } from "./inline-editor";

export const DirectoryNode = memo(
	({
		directory,
		allFiles,
		selectedFile,
		level,
		isIgnored,
		getFileStatus,
		showIgnoredFiles,
		onFileClick,
		onToggleSelect,
		isSelected,
		onCreateFile,
		onCreateFolder,
		setRenameTarget,
		setDraftName,
		renameTarget,
		draftName,
		draft,
		commitDraft,
		cancelDraft,
	}: DirectoryNodeProps) => {
		const [loading, setLoading] = useState(false);
		const handlers = useFileTreeStore(useShallow(selectFileTreeHandlers));
		const { isExpanded, toggleDir } = useDirectoryTreeStore(
			useShallow((state) => ({
				isExpanded: state.isExpanded(directory.path),
				toggleDir: state.toggleDir,
			})),
		);

		// Get directory data from the tree structure
		const dirData = useFileStore(
			useShallow(state => {
				// Get the directory's path segments
				const pathParts = directory.path.split('/').filter(Boolean);
				
				// Start at the root of the tree
				let node = state.tree;
				
				// If we're at root or tree is not available, return minimal data
				if (pathParts.length === 0 || !node) {
					return { 
						node,
						isIgnored: state.isIgnored,
						getFileStatus: state.getFileStatus
					};
				}
				
				// Traverse the tree to find this directory's node
				for (const part of pathParts) {
					if (!node || !node.children[part]) {
						return { 
							node: null,
							isIgnored: state.isIgnored,
							getFileStatus: state.getFileStatus
						};
					}
					node = node.children[part];
				}
				
				return { 
					node,
					isIgnored: state.isIgnored,
					getFileStatus: state.getFileStatus
				};
			})
		);

		const handleToggle = useCallback(async () => {
			if (!isExpanded) {
				setLoading(true);
				try {
					await useFileStore.getState().loadDirectoryChildren(directory.path);
					toggleDir(directory.path);
				} finally {
					setLoading(false);
				}
			} else {
				toggleDir(directory.path);
			}
		}, [directory.path, isExpanded, toggleDir]);

		// Check if draft is targeting this directory
		const showDraft = draft && draft.parentDir === directory.path;

		// Auto-expand the directory if a draft is being created inside it
		useEffect(() => {
			if (showDraft && !isExpanded) {
				handleToggle();
			}
		}, [showDraft, isExpanded, handleToggle]);

		// Get direct child dirs and files from the tree - efficient O(children) operation
		const { childDirs, childFiles } = useMemo(() => {
			const childDirs: FileInfo[] = [];
			const childFiles: FileInfo[] = [];

			// If we don't have tree data yet, return empty arrays
			if (!dirData.node || !dirData.node.children) {
				return { childDirs, childFiles };
			}

			// Extract children from the tree node
			for (const [name, childNode] of Object.entries(dirData.node.children)) {
				// Skip ignored files unless showIgnoredFiles is true
				if (childNode.file && !showIgnoredFiles && dirData.isIgnored(childNode.file.path)) {
					continue;
				}
				
				if (childNode.file) {
					if (childNode.file.isDirectory) {
						childDirs.push(childNode.file);
					} else {
						childFiles.push(childNode.file);
					}
				}
			}

			// Sort alphabetically
			childDirs.sort((a, b) => a.name.localeCompare(b.name));
			childFiles.sort((a, b) => a.name.localeCompare(b.name));

			return { childDirs, childFiles };
		}, [dirData.node, dirData.isIgnored, showIgnoredFiles]);

		const isRenaming = renameTarget === directory.path;

		// If we don't have the tree data yet, use a fallback to keep things working
		// This can happen during initial load or if we haven't built the tree yet
		const shouldFallbackToLegacyMethod = !dirData.node && allFiles.length > 0;
		
		// Legacy method as fallback - only used if tree data is not available
		const legacyChildrenData = useMemo(() => {
			if (!shouldFallbackToLegacyMethod) {
				return { childDirs: [], childFiles: [] };
			}
			
			const childDirs: typeof allFiles = [];
			const childFiles: typeof allFiles = [];
			const basePathWithSlash = `${directory.path}/`;

			for (const file of allFiles) {
				if (file.path === directory.path) continue;
				if (!file.path.startsWith(basePathWithSlash)) continue;
				
				// Skip ignored files unless showIgnoredFiles is true
				if (!showIgnoredFiles && isIgnored(file.path)) continue;

				const relative = file.path.substring(basePathWithSlash.length);
				if (relative.includes("/")) {
					// deeper level
					if (file.isDirectory) {
						// ensure we only capture the top-level subdir once
						const topSegment = relative.split("/")[0];
						const topPath = `${basePathWithSlash}${topSegment}`;
						if (!childDirs.some((d) => d.path === topPath)) {
							// find the FileInfo for this directory in allFiles
							const info = allFiles.find(
								(f) => f.path === topPath && f.isDirectory,
							);
							if (info) childDirs.push(info);
						}
					}
				} else {
					// immediate child
					if (file.isDirectory) {
						childDirs.push(file);
					} else {
						childFiles.push(file);
					}
				}
			}

			// Sort alphabetically
			childDirs.sort((a, b) => a.name.localeCompare(b.name));
			childFiles.sort((a, b) => a.name.localeCompare(b.name));

			return { childDirs, childFiles };
		}, [shouldFallbackToLegacyMethod, allFiles, directory.path, isIgnored, showIgnoredFiles]);

		// Use the appropriate data source
		const finalChildDirs = shouldFallbackToLegacyMethod ? legacyChildrenData.childDirs : childDirs;
		const finalChildFiles = shouldFallbackToLegacyMethod ? legacyChildrenData.childFiles : childFiles;

		return (
			<ContextMenu>
				<ContextMenuTrigger>
					<div style={{ paddingLeft: level > 0 ? `${level * 4}px` : "0" }}>
						<button
							type="button"
							className={cn(
								"group flex w-full items-center gap-1 rounded-md px-2 py-1.5",
								isExpanded ? "bg-neutral-700/50" : "hover:!bg-neutral-700/50",
							)}
							onClick={(e) => {
								e.stopPropagation();
								if (!isRenaming) handleToggle();
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									if (!isRenaming) handleToggle();
								}
							}}
						>
							<div className="h-4 w-4 p-0">
								<ChevronRight
									className={cn(
										"h-3 w-3 transition-transform",
										isExpanded && "rotate-90",
									)}
								/>
							</div>
							<div className="h-auto p-0">
								{loading ? (
									<div className="h-4 w-4 animate-spin rounded-full border-border border-b-2" />
								) : isExpanded ? (
									<FolderOpen className="h-4 w-4 text-amber-500" />
								) : (
									<Folder className="h-4 w-4 text-amber-500" />
								)}
							</div>
							{isRenaming ? (
								<div className="flex-1">
									<InlineEditor
										value={draftName}
										onChange={setDraftName}
										onConfirm={() => {
											useFileStore
												.getState()
												.renameItem(directory.path, draftName);
											setRenameTarget(null);
										}}
										onCancel={() => setRenameTarget(null)}
									/>
								</div>
							) : (
								<span className="font-medium text-sm">{directory.name}</span>
							)}
						</button>

						{/* Show draft item specifically for this directory when it's the target and not yet expanded */}
						{showDraft && !isExpanded && (
							<div className="mt-0.5 ml-4 flex items-center gap-1 rounded-md bg-neutral-700/20 px-2 py-1.5">
								{draft.isDirectory ? (
									<Folder className="h-4 w-4 text-amber-500" />
								) : (
									getFileIcon(draftName)
								)}
								<InlineEditor
									key={`draft-${directory.path}`}
									value={draftName}
									onChange={setDraftName}
									onConfirm={commitDraft}
									onCancel={cancelDraft}
									className="flex-1"
								/>
							</div>
						)}

						{isExpanded && (
							<div className="mt-0.5 ml-4 w-full space-y-0.5">
								{/* Show draft item inside expanded directory */}
								{showDraft && (
									<div className="flex items-center gap-1 rounded-md bg-neutral-700/20 px-2 py-1.5">
										{draft.isDirectory ? (
											<Folder className="h-4 w-4 text-amber-500" />
										) : (
											getFileIcon(draftName)
										)}
										<InlineEditor
											key={`draft-${directory.path}`}
											value={draftName}
											onChange={setDraftName}
											onConfirm={commitDraft}
											onCancel={cancelDraft}
											className="flex-1"
										/>
									</div>
								)}

								{finalChildDirs.map((dir) => (
									<DirectoryNode
										key={dir.path}
										directory={dir}
										allFiles={allFiles}
										selectedFile={selectedFile}
										level={level + 1}
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
								{finalChildFiles.map((file) => (
									<FileNode
										key={file.path}
										file={file}
										isSelected={selectedFile?.path === file.path}
										isIgnored={isIgnored(file.path)}
										fileStatus={getFileStatus(file.path)}
										onSelect={() => onFileClick(file)}
										onToggleSelect={() => onToggleSelect(file)}
										isChecked={isSelected(file)}
										onDelete={() =>
											useFileStore.getState().deleteFile(file.path)
										}
										setRenameTarget={setRenameTarget}
										setDraftName={setDraftName}
										renameTarget={renameTarget}
										draftName={draftName}
									/>
								))}
							</div>
						)}
					</div>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem
						onClick={() => {
							console.log("Creating folder in directory:", directory.path);
							onCreateFolder(true, directory.path);
						}}
					>
						<FolderPlus className="mr-2 h-4 w-4" />
						New Folder
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => {
							console.log("Creating file in directory:", directory.path);
							onCreateFile(false, directory.path);
						}}
					>
						<FilePlus className="mr-2 h-4 w-4" />
						New File
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => {
							setRenameTarget(directory.path);
							setDraftName(directory.name);
						}}
					>
						<Pencil className="mr-2 h-4 w-4" />
						Rename
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						variant="destructive"
						onClick={() => useFileStore.getState().deleteFile(directory.path)}
					>
						Delete Folder
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	},
	(prev, next) => {
		// Optimizing memo comparison by checking exactly what matters
		return (
			prev.directory.path === next.directory.path &&
			prev.allFiles === next.allFiles && 
			prev.selectedFile?.path === next.selectedFile?.path &&
			prev.showIgnoredFiles === next.showIgnoredFiles &&
			prev.renameTarget === next.renameTarget &&
			prev.draft?.parentDir === next.draft?.parentDir
		);
	},
);
DirectoryNode.displayName = "DirectoryNode";
