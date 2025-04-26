"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFileIcon } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/file-store";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useGitStatusStore } from "@/store/git-status-store";
import { useIDEStore } from "@/store/ide-store";
import type { FileInfo } from "@/types/files";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import {
	type SyntheticEvent,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

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
	isFolderExpanded: (path: string) => boolean;
	toggleFolderExpanded: (path: string) => void;
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
	} = useFileStore();

	// Use IDE store for project state
	const { activeProject } = useIDEStore();

	// Use file tree store for UI state
	const {
		searchQuery,
		filteredFiles,
		isFolderExpanded,
		toggleFolderExpanded,
		setSearchQuery,
		setFilteredFiles,
		clearSearch,
	} = useFileTreeStore();

	// Use git store for status
	const { isIgnored, getFileStatus, showIgnoredFiles } = useGitStatusStore();

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

	return (
		<ScrollArea className="h-full">
			<div className="p-2">
				{needsDirectoryPermission ? (
					<PermissionRequest onOpenFolder={openFolder} />
				) : directoryLoading && !filteredFiles.length ? (
					<LoadingState />
				) : error ? (
					<ErrorState error={error} onOpenFolder={openFolder} />
				) : filteredFiles.length === 0 ? (
					<EmptyState searchQuery={searchQuery} onClearSearch={clearSearch} />
				) : (
					<FileList
						files={filteredFiles}
						selectedFile={selectedFile}
						currentPath={currentPath}
						isIgnored={isIgnored}
						getFileStatus={getFileStatus}
						showIgnoredFiles={showIgnoredFiles}
						onFileClick={handleFileClick}
						onToggleSelect={toggleFileSelection}
						isSelected={isFileSelected}
						isFolderExpanded={isFolderExpanded}
						toggleFolderExpanded={toggleFolderExpanded}
					/>
				)}
			</div>
		</ScrollArea>
	);
}

// Memoized loading state component
const LoadingState = memo(() => (
	<div className="flex h-24 items-center justify-center">
		<div className="mr-2 h-6 w-6 animate-spin rounded-full border-blue-500 border-b-2" />
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
						className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
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
		isFolderExpanded,
		toggleFolderExpanded,
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
		isFolderExpanded: (path: string) => boolean;
		toggleFolderExpanded: (path: string) => void;
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

		return (
			<div className="animate-[fadeIn_0.2s_ease-out] justify-start space-y-0.5">
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
						isFolderExpanded={isFolderExpanded}
						toggleFolderExpanded={toggleFolderExpanded}
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
		isFolderExpanded,
		toggleFolderExpanded,
	}: DirectoryNodeProps) => {
		const [loading, setLoading] = useState(false);
		const isExpanded = isFolderExpanded(directory.path);
		console.log(`DirectoryNode ${directory.path} isExpanded: ${isExpanded}`);

		const handleToggle = useCallback(
			async (e?: SyntheticEvent) => {
				e?.stopPropagation();
				const fileTreeStore = useFileTreeStore.getState();
				const isCurrentlyExpanded = fileTreeStore.isFolderExpanded(
					directory.path,
				);
				console.log(
					`handleToggle called for ${directory.path}, current isExpanded: ${isCurrentlyExpanded}`,
				);
				if (!isCurrentlyExpanded) {
					setLoading(true);
					try {
						const fileStore = useFileStore.getState();
						await fileStore.loadDirectoryChildren(directory.path);
					} finally {
						setLoading(false);
					}
				}
				toggleFolderExpanded(directory.path);
			},
			[directory.path, toggleFolderExpanded],
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

		return (
			<div style={{ paddingLeft: level > 0 ? `${level * 16}px` : "0" }}>
				<button
					type="button"
					className={cn(
						"group flex w-full items-center gap-1 rounded-md px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800/50",
						isExpanded && "bg-white dark:bg-gray-800/30",
					)}
					onClick={(e) => {
						e.stopPropagation();
						handleToggle(e);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleToggle(e);
						}
					}}
				>
					<div className="h-4 w-4 p-0 hover:bg-transparent">
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
					<span className="font-medium text-sm">{directory.name}</span>
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
								isFolderExpanded={isFolderExpanded}
								toggleFolderExpanded={toggleFolderExpanded}
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
							/>
						))}
					</div>
				)}
			</div>
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
	}: {
		file: FileInfo;
		isSelected: boolean;
		isIgnored: boolean;
		fileStatus: string;
		onSelect: () => void;
		onToggleSelect: () => void;
		isChecked: boolean;
	}) => {
		// Debug log to see what status we're getting
		if (fileStatus) {
			console.log(`File ${file.name} has status: ${fileStatus}`);
		}

		const statusColor =
			fileStatus === "modified"
				? "bg-amber-500"
				: fileStatus === "added" || fileStatus === "untracked"
					? "bg-green-500"
					: fileStatus === "deleted"
						? "bg-red-500"
						: "";

		return (
			<Button
				variant="ghost"
				size="sm"
				className={cn(
					"group flex w-full items-center gap-1 rounded-md px-2 py-1.5 hover:bg-red-800/50",
					isSelected
						? "bg-neutral-600"
						: "hover:bg-gray-100 dark:hover:bg-gray-800/50",
					isIgnored ? "opacity-50" : "",
					fileStatus
						? `border-l-2 border-${statusColor.replace("bg-", "")}`
						: "",
				)}
				onClick={onSelect}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						onSelect();
					}
				}}
			>
				<Checkbox
					checked={isChecked}
					onCheckedChange={onToggleSelect}
					onClick={(e) => e.stopPropagation()}
					className="mr-1 h-3.5 w-3.5"
				/>
				<div className="h-auto p-0">{getFileIcon(file.name)}</div>
				<span className="flex-1 truncate pl-1 text-left text-sm">
					{file.name}
					{fileStatus && (
						<span
							className={`ml-1 text-xs ${
								fileStatus === "modified"
									? "text-amber-500"
									: fileStatus === "added" || fileStatus === "untracked"
										? "text-green-500"
										: fileStatus === "deleted"
											? "text-red-500"
											: ""
							}`}
						>
							({fileStatus})
						</span>
					)}
				</span>
				{fileStatus && (
					<div className={cn("h-2.5 w-2.5 rounded-full", statusColor)} />
				)}
			</Button>
		);
	},
);
FileNode.displayName = "FileNode";
