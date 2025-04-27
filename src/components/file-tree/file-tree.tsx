"use client";

import { SelectedFilesBar } from "@/components/ide/selected-files-bar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { EmptyState } from "./components/empty-state";
import { ErrorState } from "./components/error-state";
import { FileList } from "./components/file-list";
import { LoadingState } from "./components/loading-state";
import { PermissionRequest } from "./components/permission-request";
import { useFileTree } from "./hooks/use-file-tree";

export function FileTree() {
	const {
		files,
		selectedFile,
		loading,
		directoryLoading,
		error,
		currentPath,
		searchQuery,
		needsDirectoryPermission,
		draft,
		draftName,
		renameTarget,
		isIgnored,
		getFileStatus,
		showIgnoredFiles,
		handleFileClick,
		toggleFileSelection,
		isFileSelected,
		openFolder,
		setSearchQuery,
		clearSearch,
		handleCreateItem,
		commitDraft,
		cancelDraft,
		setRenameTarget,
		setDraftName,
		deleteFile,
		filteredFiles,
		selectedFiles,
		clearSelectedFiles,
	} = useFileTree();

	return (
		<div className="flex h-full flex-col">
			{/* Header section with search and selected files */}
			<div className="border-neutral-800 border-b">
				{/* Search bar */}
				<div className="px-2 py-2">
					<div className="relative">
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
				</div>

				{/* Selected files bar */}
				{selectedFiles.length > 0 && (
					<div className="border-neutral-800 border-t px-2 py-2">
						<SelectedFilesBar
							selectedFiles={selectedFiles}
							currentPath={currentPath}
							clearSelectedFiles={clearSelectedFiles}
						/>
					</div>
				)}
			</div>

			{/* File tree */}
			<ScrollArea className="flex-1">
				<div className="p-2">
					{needsDirectoryPermission ? (
						<PermissionRequest onOpenFolder={openFolder} />
					) : directoryLoading && !files.length ? (
						<LoadingState />
					) : error ? (
						<ErrorState error={error} onOpenFolder={openFolder} />
					) : files.length === 0 ? (
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
							onCreateFile={(isDirectory, parentDir) =>
								handleCreateItem(isDirectory, parentDir)
							}
							onCreateFolder={(isDirectory, parentDir) =>
								handleCreateItem(isDirectory, parentDir)
							}
							onDeleteFile={deleteFile}
							draft={draft}
							renameTarget={renameTarget}
							draftName={draftName}
							setDraftName={setDraftName}
							commitDraft={commitDraft}
							cancelDraft={cancelDraft}
							setRenameTarget={setRenameTarget}
						/>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
