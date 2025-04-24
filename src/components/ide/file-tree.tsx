"use client";

import { useEffect } from "react";
import type { FileInfo } from "@/types/files";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Folder,
  FolderOpen,
  FolderClosed,
  FileBadge,
  FileCode,
  FileJson,
  FileText,
  FileType,
  FileImage,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getFileIcon, formatDate, formatFileSize } from "@/lib/file-utils";
import { useGitStatusStore } from "@/store/git-status-store";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useFileStore } from "@/store/file-store";

interface FileTreeProps {
  files: FileInfo[];
  selectedFile: FileInfo | null;
  loading: boolean;
  directoryLoading: boolean;
  error: string | null;
  searchQuery: string;
  filteredFiles: FileInfo[];
  currentPath: string;
  clearSearch: () => void;
}

export function FileTree({
  files,
  selectedFile,
  loading,
  directoryLoading,
  error,
  searchQuery,
  filteredFiles,
  currentPath,
  clearSearch,
}: FileTreeProps) {
  // Use git store
  const { isIgnored, getFileStatus, showIgnoredFiles, setCurrentPath } =
    useGitStatusStore();

  // Get the MAIN file store - this is needed for file operations
  const fileStore = useFileStore();

  // Get directoryLoading from the file store if not provided
  const directoryLoadingState = directoryLoading ?? fileStore.directoryLoading;

  // Use the file tree store for UI state
  const {
    isFolderExpanded,
    toggleFolderExpanded,
    setFiles,
    setSelectedFile,
    setLoading,
    setDirectoryLoading,
    setError,
    setSearchQuery,
    setFilteredFiles,
    setCurrentPath: setFileTreeCurrentPath,
  } = useFileTreeStore();

  // Connect to the main file store operations
  const handleFileClick = (file: FileInfo) => {
    fileStore.handleFileClick(file);
  };

  const toggleFileSelection = (file: FileInfo) => {
    fileStore.toggleFileSelection(file);
  };

  const isFileSelected = (file: FileInfo) => {
    return fileStore.isFileSelected(file);
  };

  // Update store from props when they change
  useEffect(() => {
    setFiles(files);
    setSelectedFile(selectedFile);
    setLoading(loading);
    if (setDirectoryLoading) {
      setDirectoryLoading(directoryLoadingState);
    }
    setError(error);
    setSearchQuery(searchQuery);
    setFilteredFiles(filteredFiles);
    setFileTreeCurrentPath(currentPath);

    // Update git status path
    setCurrentPath(currentPath);
  }, [
    files,
    selectedFile,
    loading,
    directoryLoadingState,
    error,
    searchQuery,
    filteredFiles,
    currentPath,
    setFiles,
    setSelectedFile,
    setLoading,
    setDirectoryLoading,
    setError,
    setSearchQuery,
    setFilteredFiles,
    setFileTreeCurrentPath,
    setCurrentPath,
  ]);

  // Use store's clearSearch instead of the prop
  const handleClearSearch = () => {
    clearSearch();
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {directoryLoadingState && !filteredFiles.length ? (
          <div className="flex h-24 items-center justify-center text-slate-500">
            <div className="mr-2 h-6 w-6 animate-spin rounded-full border-blue-500 border-b-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="flex h-24 items-center justify-center text-red-500">
            <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              Error: {error}
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex h-24 flex-col items-center justify-center text-slate-500">
            {searchQuery ? (
              <>
                <p>No files match your search</p>
                <Button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear search
                </Button>
              </>
            ) : (
              <p>This directory is empty</p>
            )}
          </div>
        ) : (
          <div
            key={currentPath}
            className="animate-[fadeIn_2s_ease-out] space-y-0.5"
          >
            {filteredFiles.map((file) => (
              <FileItem
                key={file.path}
                file={file}
                selectedFile={selectedFile}
                isIgnored={isIgnored(file.path)}
                showIgnoredFiles={showIgnoredFiles}
                fileStatus={getFileStatus(file.path)}
                filteredFiles={filteredFiles}
                handleFileClick={handleFileClick}
                toggleFileSelection={toggleFileSelection}
                isFileSelected={isFileSelected}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Separate component for each file item
function FileItem({
  file,
  selectedFile,
  isIgnored,
  showIgnoredFiles,
  fileStatus,
  filteredFiles,
  level = 0,
  handleFileClick,
  toggleFileSelection,
  isFileSelected,
}: {
  file: FileInfo;
  selectedFile: FileInfo | null;
  isIgnored: boolean;
  showIgnoredFiles: boolean;
  fileStatus: string;
  filteredFiles: FileInfo[];
  level?: number;
  handleFileClick: (file: FileInfo) => void;
  toggleFileSelection: (file: FileInfo) => void;
  isFileSelected: (file: FileInfo) => boolean;
}) {
  // Use the file tree store only for folder expansion state
  const { isFolderExpanded, toggleFolderExpanded } = useFileTreeStore();

  // Skip rendering ignored files if showIgnoredFiles is false
  if (isIgnored && !showIgnoredFiles) {
    return null;
  }

  const isExpanded = isFolderExpanded(file.path);

  const statusColorClass =
    fileStatus === "modified"
      ? "text-amber-500 dark:text-amber-400"
      : fileStatus === "added"
      ? "text-green-500 dark:text-green-400"
      : fileStatus === "deleted"
      ? "text-red-500 dark:text-red-400"
      : fileStatus === "untracked"
      ? "text-blue-500 dark:text-blue-400"
      : "";

  const gitStatusIndicator = fileStatus ? (
    <div
      className={cn(
        "absolute top-0 bottom-0 left-0 w-1 rounded-l-md",
        fileStatus === "modified"
          ? "bg-amber-500"
          : fileStatus === "added"
          ? "bg-green-500"
          : fileStatus === "deleted"
          ? "bg-red-500"
          : fileStatus === "untracked"
          ? "bg-blue-500"
          : ""
      )}
    />
  ) : null;

  // Handle folder expansion only (for the chevron)
  const handleFolderExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (file.isDirectory) {
      toggleFolderExpanded(file.path);
    }
  };

  // Handle folder keyboard interaction for expansion
  const handleFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      if (file.isDirectory) {
        toggleFolderExpanded(file.path);
      }
    }
  };

  // Get child files - only if directory is expanded
  const childFiles =
    file.isDirectory && isExpanded
      ? filteredFiles.filter((child) => {
          // Check if this file is a direct child of the current directory
          const parentPath = file.path.endsWith("/")
            ? file.path
            : `${file.path}/`;
          return (
            child.path !== file.path &&
            child.path.startsWith(parentPath) &&
            !child.path.slice(parentPath.length).includes("/")
          );
        })
      : [];

  return (
    <div>
      <div
        className={cn(
          "relative flex cursor-pointer items-center gap-2 rounded-md py-1.5 transition-all",
          selectedFile?.path === file.path
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
            : "hover:bg-slate-100 dark:hover:bg-slate-800/50",
          isIgnored ? "text-slate-400 dark:text-slate-600" : ""
        )}
        style={{ paddingLeft: `${level > 0 ? level * 16 + 8 : 12}px` }}
      >
        {gitStatusIndicator}

        <Checkbox
          checked={isFileSelected(file)}
          onCheckedChange={() => toggleFileSelection(file)}
          onClick={(e) => e.stopPropagation()}
          className="mr-1 h-4 w-4"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "mr-2 shrink-0 p-0 h-auto",
            isIgnored
              ? "text-slate-400 dark:text-slate-600"
              : statusColorClass ||
                  (file.isDirectory
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-blue-500 dark:text-blue-400")
          )}
          onClick={() => handleFileClick(file)}
        >
          {file.isDirectory ? (
            file.name === ".git" || isIgnored ? (
              <FolderClosed size={18} />
            ) : isExpanded ? (
              <FolderOpen size={18} />
            ) : (
              <Folder size={18} />
            )
          ) : (
            getFileIcon(file.name)
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-w-0 flex-1 h-auto p-0 justify-start"
          onClick={() => handleFileClick(file)}
        >
          <div className="flex flex-col items-start w-full">
            <span
              className={cn(
                "truncate font-medium",
                isIgnored
                  ? "text-slate-400 dark:text-slate-600"
                  : statusColorClass
              )}
            >
              {file.name}
            </span>
            <span className="flex items-center text-xs text-slate-500 dark:text-slate-400 truncate">
              {formatDate(new Date(file.lastModified))}
              {!file.isDirectory && ` • ${formatFileSize(file.size)}`}
            </span>
          </div>
        </Button>
      </div>

      {/* Render children if this is an expanded directory */}
      {file.isDirectory && isExpanded && childFiles.length > 0 && (
        <div className="mt-0.5">
          {childFiles.map((childFile) => (
            <FileItem
              key={childFile.path}
              file={childFile}
              selectedFile={selectedFile}
              isIgnored={isIgnored}
              showIgnoredFiles={showIgnoredFiles}
              fileStatus={fileStatus}
              filteredFiles={filteredFiles}
              level={level + 1}
              handleFileClick={handleFileClick}
              toggleFileSelection={toggleFileSelection}
              isFileSelected={isFileSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
