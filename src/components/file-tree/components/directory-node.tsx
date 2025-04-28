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
import { useFileStore } from "@/store/file-store";
import {
	ChevronRight,
	FilePlus,
	Folder,
	FolderOpen,
	FolderPlus,
	Pencil,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
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
		const [isExpanded, setIsExpanded] = useState(false);

		// Check if draft is targeting this directory
		const showDraft = draft && draft.parentDir === directory.path;

		const handleToggle = useCallback(
			async (e?: React.SyntheticEvent) => {
				e?.stopPropagation();
				if (!isExpanded) {
					setLoading(true);
					try {
						const fileStore = useFileStore.getState();
						await fileStore.loadDirectoryChildren(directory.path);
						setIsExpanded(true);
					} catch (error) {
						console.error("Error loading directory:", error);
						// Don't expand on error
					} finally {
						setLoading(false);
					}
				} else {
					setIsExpanded(false);
				}
			},
			[directory.path, isExpanded],
		);

		// Auto-expand the directory if a draft is being created inside it
		useEffect(() => {
			if (showDraft && !isExpanded) {
				handleToggle();
			}
		}, [showDraft, isExpanded, handleToggle]);

		// Get direct child dirs and files
		const { childDirs, childFiles } = useMemo(() => {
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
		}, [allFiles, directory.path, isIgnored, showIgnoredFiles]);

		const isRenaming = renameTarget === directory.path;

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
								if (!isRenaming) handleToggle(e);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									if (!isRenaming) handleToggle(e);
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

								{childDirs.map((dir) => (
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
								{childFiles.map((file) => (
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
);
DirectoryNode.displayName = "DirectoryNode";
