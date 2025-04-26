"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFileIcon } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/file-store";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useGitStatusStore } from "@/store/git-status-store";
import { useIDEStore } from "@/store/ide-store";
import type { FileInfo } from "@/types/files";
import {
	ChevronRight,
	FilePlus,
	Folder,
	FolderOpen,
	FolderPlus,
	Search,
	X,
} from "lucide-react";
import {
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

// Inline editor for creating/renaming
const InlineEditor = ({
	value,
	onChange,
	onConfirm,
	onCancel,
}: {
	value: string;
	onChange: (v: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
}) => {
	const inputRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		inputRef.current?.focus();
	}, []);
	return (
		<input
			ref={inputRef}
			className="w-full rounded-md bg-neutral-800 px-2 py-1 text-sm outline-none"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") onConfirm();
				if (e.key === "Escape") onCancel();
			}}
		/>
	);
};

// Update DirectoryNode props interface
interface DirectoryNodeProps {
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
	onCreateFile: (parentDir: string) => void;
	onCreateFolder: (parentDir: string) => void;
	setRenameTarget: (p: string | null) => void;
	setDraftName: (n: string) => void;
	renameTarget: string | null;
	draftName: string;
}

export function FileTree() {
	// Use file store for core data and operations
	const {
		files,
		selectedFile,
		loading,
		directoryLoading,
		error,
		currentPath,
		handleFileClick,
		toggleFileSelection,
		isFileSelected,
		openFolder,
		loadDirectory,
		needsDirectoryPermission,
		createFile,
		createFolder,
		deleteFile,
	} = useFileStore();

	// Use IDE store for project state
	const { activeProject } = useIDEStore();

	// Use file tree store for UI state
	const {
		searchQuery,
		filteredFiles,
		setSearchQuery,
		setFilteredFiles,
		clearSearch,
	} = useFileTreeStore();

	// State for creation dialogs
	const [draft, setDraft] = useState<{
		parentDir: string;
		isDirectory: boolean;
	} | null>(null);

	const [renameTarget, setRenameTarget] = useState<string | null>(null);
	const [draftName, setDraftName] = useState("");

	// Update filtered files when search changes
	useEffect(() => {
		if (!searchQuery) {
			setFilteredFiles(files);
			return;
		}

		const lowercaseQuery = searchQuery.toLowerCase();
		const filtered = files.filter((file) =>
			file.name.toLowerCase().includes(lowercaseQuery),
		);

		setFilteredFiles(filtered);
	}, [files, searchQuery, setFilteredFiles]);

	const handleDirectoryLoad = useCallback(async (dirPath: string) => {
		const fileStore = useFileStore.getState();
		try {
			await fileStore.loadDirectory(dirPath, false);
		} catch (error) {
			console.error("Error loading directory:", error);
		}
	}, []);

	const handleCreateFile = useCallback((parentDir: string) => {
		console.log("handleCreateFile called with parentDir:", parentDir);
		setDraft({ parentDir, isDirectory: false });
		setDraftName("");
	}, []);

	const handleCreateFolder = useCallback((parentDir: string) => {
		console.log("handleCreateFolder called with parentDir:", parentDir);
		setDraft({ parentDir, isDirectory: true });
		setDraftName("");
	}, []);

	const commitDraft = useCallback(async () => {
		console.log("Committing draft:", { draft, draftName, renameTarget });
		if (!draft || !draftName) return;
		try {
			if (renameTarget) {
				await useFileStore.getState().renameItem(renameTarget, draftName);
				setRenameTarget(null);
			} else if (draft.isDirectory) {
				await createFolder(draft.parentDir, draftName);
			} else {
				await createFile(draft.parentDir, draftName);
			}
		} catch (e) {
			console.error("Error saving draft:", e);
		}
		setDraft(null);
		setDraftName("");
	}, [draft, draftName, createFile, createFolder, renameTarget]);

	return (
		<>
			<div className="flex h-full flex-col">
				{/* Search bar */}
				<div className="flex gap-2 border-neutral-800 border-b px-2 py-2">
					<div className="relative flex-1">
						<Input
							className="h-8 pl-8 text-sm"
							placeholder="Search files..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<Search className="absolute top-1.5 left-2.5 h-4 w-4 text-neutral-400" />
						{searchQuery && (
							<button
								type="button"
								className="absolute top-1.5 right-2 h-4 w-4 text-neutral-400 hover:text-neutral-100"
								onClick={clearSearch}
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<FolderPlus className="h-4 w-4" />
							</Button>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem onClick={() => handleCreateFolder(currentPath)}>
								<FolderPlus className="mr-2 h-4 w-4" />
								New Folder
							</ContextMenuItem>
							<ContextMenuItem onClick={() => handleCreateFile(currentPath)}>
								<FilePlus className="mr-2 h-4 w-4" />
								New File
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				</div>

				{/* File tree */}
				<ScrollArea className="flex-1">
					<div className="p-2">
						{needsDirectoryPermission ? (
							<PermissionRequest onOpenFolder={openFolder} />
						) : directoryLoading && !filteredFiles.length ? (
							<LoadingState />
						) : error ? (
							<ErrorState error={error} onOpenFolder={openFolder} />
						) : filteredFiles.length === 0 ? (
							<EmptyState
								searchQuery={searchQuery}
								onClearSearch={clearSearch}
							/>
						) : (
							<FileList
								files={filteredFiles}
								selectedFile={selectedFile}
								currentPath={currentPath}
								isIgnored={useGitStatusStore.getState().isIgnored}
								getFileStatus={useGitStatusStore.getState().getFileStatus}
								showIgnoredFiles={useGitStatusStore.getState().showIgnoredFiles}
								onFileClick={handleFileClick}
								onToggleSelect={toggleFileSelection}
								isSelected={isFileSelected}
								onCreateFile={handleCreateFile}
								onCreateFolder={handleCreateFolder}
								onDeleteFile={deleteFile}
								draft={draft}
								renameTarget={renameTarget}
								draftName={draftName}
								setDraftName={setDraftName}
								commitDraft={commitDraft}
								cancelDraft={() => {
									setDraft(null);
									setRenameTarget(null);
								}}
								setRenameTarget={setRenameTarget}
							/>
						)}
					</div>
				</ScrollArea>
			</div>
		</>
	);
}

// Memoized loading state component
const LoadingState = memo(() => (
	<div className="flex h-24 items-center justify-center">
		<div className="mr-2 h-6 w-6 animate-spin rounded-full border-neutral-500 border-b-2" />
		Loading files...
	</div>
));
LoadingState.displayName = "LoadingState";

// Add PermissionRequest component
const PermissionRequest = memo(
	({ onOpenFolder }: { onOpenFolder: () => void }) => (
		<div className="flex h-24 flex-col items-center justify-center gap-2 p-4 text-center">
			<p className="text-sm">Directory access needed to show files</p>
			<Button
				onClick={onOpenFolder}
				className="mt-2"
				variant="outline"
				size="sm"
			>
				Grant Access
			</Button>
		</div>
	),
);
PermissionRequest.displayName = "PermissionRequest";

// Memoized error state component
const ErrorState = memo(
	({ error, onOpenFolder }: { error: string; onOpenFolder: () => void }) => (
		<div className="flex items-center justify-center">
			<div className="">
				{error === "No folder selected" ? (
					<div className="flex flex-col items-center gap-2">
						<span>Select a folder to view files</span>
						<Button
							onClick={onOpenFolder}
							className="m-2"
							variant="outline"
							size="sm"
						>
							Open Folder
						</Button>
					</div>
				) : (
					`Error: ${error}`
				)}
			</div>
		</div>
	),
);
ErrorState.displayName = "ErrorState";

// Memoized empty state component
const EmptyState = memo(
	({
		searchQuery,
		onClearSearch,
	}: {
		searchQuery: string;
		onClearSearch: () => void;
	}) => (
		<div className="flex h-24 flex-col items-center justify-center">
			{searchQuery ? (
				<>
					<p>No files match your search</p>
					<Button
						type="button"
						onClick={onClearSearch}
						className="mt-2"
						variant="outline"
						size="sm"
					>
						Clear search
					</Button>
				</>
			) : (
				<p>This directory is empty</p>
			)}
		</div>
	),
);
EmptyState.displayName = "EmptyState";

// Helper to get parent path
const getParentPath = (filePath: string): string => {
	const idx = filePath.lastIndexOf("/");
	if (idx === -1) return "";
	return filePath.substring(0, idx);
};

// Memoized file list component
const FileList = memo(
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
	}: {
		files: FileInfo[];
		selectedFile: FileInfo | null;
		currentPath: string;
		isIgnored: (path: string) => boolean;
		getFileStatus: (path: string) => string;
		showIgnoredFiles: boolean;
		onFileClick: (file: FileInfo) => void;
		onToggleSelect: (file: FileInfo) => void;
		isSelected: (file: FileInfo) => boolean;
		onCreateFile: (parentDir: string) => void;
		onCreateFolder: (parentDir: string) => void;
		onDeleteFile: (filePath: string) => void;
		draft: { parentDir: string; isDirectory: boolean } | null;
		renameTarget: string | null;
		draftName: string;
		setDraftName: (name: string) => void;
		commitDraft: () => void;
		cancelDraft: () => void;
		setRenameTarget: (p: string | null) => void;
	}) => {
		const { rootDirs, rootFiles } = useMemo(() => {
			const rootDirs: FileInfo[] = [];
			const rootFiles: FileInfo[] = [];

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
		console.log("FileList state:", {
			draft,
			currentPath,
			showDraft,
			draftName,
		});

		return (
			<div className="animate-[fadeIn_0.1s_ease-out] justify-start space-y-0.5">
				{/* Root level create buttons */}
				<ContextMenu>
					<ContextMenuTrigger className="block h-8 w-full">
						<div className="hover:!bg-neutral-700/50 rounded-md px-2 py-1.5">
							<span className="text-neutral-400 text-sm">Project Root</span>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem
							onClick={() => {
								console.log(
									"Root context menu - creating folder in:",
									currentPath,
								);
								onCreateFolder(currentPath);
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
								onCreateFile(currentPath);
							}}
						>
							<FilePlus className="mr-2 h-4 w-4" />
							New File
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>

				{showDraft && (
					<div className="flex items-center gap-1 rounded-md bg-neutral-700/20 px-2 py-1.5">
						{draft.isDirectory ? (
							<Folder className="h-4 w-4 text-amber-500" />
						) : (
							getFileIcon(draftName || "file.txt")
						)}
						<InlineEditor
							value={draftName}
							onChange={setDraftName}
							onConfirm={commitDraft}
							onCancel={cancelDraft}
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

// Memoized directory node component
const DirectoryNode = memo(
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
	}: DirectoryNodeProps) => {
		const [loading, setLoading] = useState(false);
		const [isExpanded, setIsExpanded] = useState(false);

		const handleToggle = useCallback(
			async (e?: SyntheticEvent) => {
				e?.stopPropagation();
				if (!isExpanded) {
					setLoading(true);
					try {
						const fileStore = useFileStore.getState();
						await fileStore.loadDirectoryChildren(directory.path);
					} finally {
						setLoading(false);
					}
				}
				setIsExpanded(!isExpanded);
			},
			[directory.path, isExpanded],
		);

		// Get direct child dirs and files
		const { childDirs, childFiles } = useMemo(() => {
			const childDirs: FileInfo[] = [];
			const childFiles: FileInfo[] = [];

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
						{isExpanded && (
							<div className="mt-0.5 ml-4 w-full space-y-0.5">
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
							onCreateFolder(directory.path);
						}}
					>
						<FolderPlus className="mr-2 h-4 w-4" />
						New Folder
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => {
							console.log("Creating file in directory:", directory.path);
							onCreateFile(directory.path);
						}}
					>
						<FilePlus className="mr-2 h-4 w-4" />
						New File
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						variant="destructive"
						onClick={() => useFileStore.getState().deleteFile(directory.path)}
					>
						Delete Folder
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => {
							setRenameTarget(directory.path);
							setDraftName(directory.name);
						}}
					>
						Rename
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	},
);
DirectoryNode.displayName = "DirectoryNode";

// Memoized file node component
const FileNode = memo(
	({
		file,
		isSelected,
		isIgnored,
		fileStatus,
		onSelect,
		onToggleSelect,
		isChecked,
		onDelete,
		setRenameTarget,
		setDraftName,
		renameTarget,
		draftName,
	}: {
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
	}) => {
		const statusColor =
			fileStatus === "modified"
				? "bg-amber-500"
				: fileStatus === "added" || fileStatus === "untracked"
					? "bg-green-500"
					: fileStatus === "deleted"
						? "bg-red-500"
						: "";

		const isRenaming = renameTarget === file.path;

		return (
			<ContextMenu>
				<ContextMenuTrigger>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"group flex w-full items-center gap-1 rounded-md px-2 py-1.5",
							isSelected
								? "hover:!bg-neutral-700/50 bg-neutral-700/60"
								: "hover:!bg-neutral-700/50",
							isIgnored ? "opacity-50" : "",
							fileStatus
								? `border-l-1 border-${statusColor.replace("bg-", "")}`
								: "",
						)}
						onClick={isRenaming ? undefined : onSelect}
						onKeyDown={(e) => {
							if (!isRenaming && (e.key === "Enter" || e.key === " ")) {
								onSelect();
							}
						}}
					>
						<Checkbox
							checked={isChecked}
							onCheckedChange={isRenaming ? undefined : onToggleSelect}
							onClick={(e) =>
								isRenaming ? e.preventDefault() : e.stopPropagation()
							}
							className="mr-1 h-3.5 w-3.5"
						/>
						<div className="h-auto p-0">{getFileIcon(file.name)}</div>
						{isRenaming ? (
							<div className="flex-1">
								<InlineEditor
									value={draftName}
									onChange={setDraftName}
									onConfirm={() => {
										useFileStore.getState().renameItem(file.path, draftName);
										setRenameTarget(null);
									}}
									onCancel={() => setRenameTarget(null)}
								/>
							</div>
						) : (
							<span className="flex-1 truncate pl-1 text-left text-sm">
								{file.name}
								{fileStatus && (
									<span
										className={`ml-1 text-xs ${fileStatus === "modified" ? "text-amber-500" : fileStatus === "added" || fileStatus === "untracked" ? "text-green-500" : fileStatus === "deleted" ? "text-red-500" : ""}`}
									>
										({fileStatus})
									</span>
								)}
							</span>
						)}
						{fileStatus && (
							<div className={cn("h-2.5 w-2.5 rounded-full", statusColor)} />
						)}
					</Button>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={onSelect}>Open File</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem variant="destructive" onClick={onDelete}>
						Delete File
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => {
							setRenameTarget(file.path);
							setDraftName(file.name);
						}}
					>
						Rename
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	},
);
FileNode.displayName = "FileNode";
