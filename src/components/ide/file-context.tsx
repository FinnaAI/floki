"use client";

import path from "path";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import type { FileInfo, FileDiff } from "@/types/files";
import { useGitStatus } from "./git-status";

interface FileContextProps {
  currentPath: string;
  files: FileInfo[];
  filteredFiles: FileInfo[];
  selectedFile: FileInfo | null;
  fileContent: string | null;
  fileDiff: FileDiff | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  pathHistory: string[];
  pathForward: string[];
  selectedFiles: FileInfo[];
  loadDirectory: (dirPath: string, addToHistory?: boolean) => Promise<void>;
  loadFileContent: (fileInfo: FileInfo) => Promise<void>;
  navigateUp: () => void;
  goBack: () => void;
  goForward: () => void;
  goToProjectRoot: () => void;
  refreshDirectory: () => void;
  getBreadcrumbs: () => Array<{ name: string; path: string }>;
  setSearchQuery: (query: string) => void;
  handleFileClick: (file: FileInfo) => void;
  toggleFileSelection: (file: FileInfo) => void;
  isFileSelected: (file: FileInfo) => boolean;
  clearSelectedFiles: () => void;
}

const FileContext = createContext<FileContextProps | null>(null);

export const FileProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentPath, setCurrentPath] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [pathForward, setPathForward] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileDiff, setFileDiff] = useState<FileDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);

  // Reference to track initialization
  const hasInitialized = useRef(false);

  // This ref will track the previous path for animation purposes
  const prevPathRef = useRef(currentPath);

  // Git status integration
  const {
    showGitStatus,
    showIgnoredFiles,
    getFileStatus,
    setCurrentPath: setGitCurrentPath,
  } = useGitStatus();

  // Filter files based on search query - memoizing the filtered result
  useEffect(() => {
    if (!searchQuery) {
      if (filteredFiles !== files) {
        setFilteredFiles(files);
      }
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = files.filter((file) =>
      file.name.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredFiles(filtered);
  }, [searchQuery, files, filteredFiles]);

  // Loading directory with animation consideration
  const loadDirectory = useCallback(
    async (dirPath: string, addToHistory = true) => {
      // Prevent unnecessary reloads if dirPath is empty and we already have files
      if (dirPath === "" && currentPath === "" && files.length > 0) {
        return;
      }

      // Skip loading same directory twice
      if (dirPath === currentPath && !loading) {
        console.log("Skipping reload of same directory:", dirPath);
        return;
      }

      setLoading(true);
      setError(null);
      setSearchQuery("");

      console.log("Loading directory:", dirPath);

      // Store path for history before it changes
      const oldPath = currentPath;
      // Update previous path ref for animation
      prevPathRef.current = oldPath;

      try {
        // Ensure we're passing the correct path to the API
        const pathParam = encodeURIComponent(dirPath);

        const response = await fetch(
          `/api/filesystem?path=${pathParam}&git=${showGitStatus}&showIgnored=${showIgnoredFiles}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API error response:", errorData);
          throw new Error(
            `HTTP error ${response.status}: ${
              errorData.error || "Unknown error"
            }`
          );
        }

        const data = await response.json();

        // Set new directory state
        setFiles(data.files);
        setFilteredFiles(data.files);
        setCurrentPath(data.path);

        // Update git component path
        setGitCurrentPath(data.path);

        // Update navigation history - only if we're not using history navigation already
        // and if we actually changed directories
        if (addToHistory && oldPath && data.path !== oldPath) {
          setPathHistory((prev) => [...prev, oldPath]);
          setPathForward([]);
        }
      } catch (err) {
        console.error("Error loading directory:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load directory"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      currentPath,
      showGitStatus,
      showIgnoredFiles,
      loading,
      files.length,
      setGitCurrentPath,
    ]
  );

  // Load file content
  const loadFileContent = useCallback(
    async (fileInfo: FileInfo) => {
      setLoading(true);
      setError(null);
      setSelectedFile(fileInfo);
      setFileDiff(null);

      try {
        const response = await fetch("/api/filesystem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filePath: fileInfo.path }),
        });

        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const data = await response.json();
        setFileContent(data.content);

        // If git status is enabled and this file is modified, load the diff immediately
        if (showGitStatus && getFileStatus(fileInfo.path) === "modified") {
          await loadFileDiff(fileInfo.path);
        }
      } catch (err) {
        console.error("Error loading file:", err);
        setError(err instanceof Error ? err.message : "Failed to load file");
        setFileContent(null);
      } finally {
        setLoading(false);
      }
    },
    [showGitStatus, getFileStatus]
  );

  // Load git diff for a file
  const loadFileDiff = async (filePath: string) => {
    try {
      const response = await fetch("/api/git/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      setFileDiff(data);
    } catch (err) {
      console.error("Error loading diff:", err);
      // Don't set error state here, not critical
    }
  };

  // Navigate to parent directory
  const navigateUp = useCallback(() => {
    if (!currentPath) {
      // No current path
      return;
    }

    // Use path.dirname to get the parent directory
    const parentDir = path.dirname(currentPath);

    // If we're at the root, go to project root
    if (
      parentDir === currentPath ||
      parentDir === path.parse(currentPath).root
    ) {
      return loadDirectory("");
    }

    // Otherwise go to parent directory
    loadDirectory(parentDir);
  }, [currentPath, loadDirectory]);

  // Go back in history
  const goBack = useCallback(() => {
    if (pathHistory.length === 0) return;

    const prevPath = pathHistory[pathHistory.length - 1];
    if (!prevPath) return;

    setPathHistory((prev) => prev.slice(0, -1));
    setPathForward((prev) => [currentPath, ...prev]);

    // Ensure we don't add this navigation to history
    loadDirectory(prevPath, false);
  }, [pathHistory, currentPath, loadDirectory]);

  // Go forward in history
  const goForward = useCallback(() => {
    if (pathForward.length === 0) return;

    const nextPath = pathForward[0];
    if (!nextPath) return;

    setPathForward((prev) => prev.slice(1));
    setPathHistory((prev) => [...prev, currentPath]);

    // Ensure we don't add this navigation to history
    loadDirectory(nextPath, false);
  }, [pathForward, currentPath, loadDirectory]);

  // Navigate to home/project root
  const goToProjectRoot = useCallback(() => {
    loadDirectory("");
  }, [loadDirectory]);

  // Reload current directory
  const refreshDirectory = useCallback(() => {
    loadDirectory(currentPath, false);
  }, [currentPath, loadDirectory]);

  // Get breadcrumbs for navigation
  const getBreadcrumbs = useCallback(() => {
    if (!currentPath) return [{ name: "project root", path: "" }];

    // Start with project root
    const crumbs = [{ name: "project root", path: "" }];

    // Split the current path
    const parts = currentPath.split(path.sep).filter(Boolean);

    // Build up the paths progressively
    for (let i = 0; i < parts.length; i++) {
      // Get all parts up to this index
      const pathParts = parts.slice(0, i + 1);
      // Join with path separator
      const fullPath = path.sep + pathParts.join(path.sep);

      const partName = parts[i] ?? "";
      crumbs.push({
        name: partName,
        path: fullPath,
      });
    }

    return crumbs;
  }, [currentPath]);

  // Handle directory navigation for files
  const handleFileClick = useCallback(
    (file: FileInfo) => {
      if (file.isDirectory) {
        loadDirectory(file.path);
      } else {
        loadFileContent(file);
      }
    },
    [loadDirectory, loadFileContent]
  );

  // Toggle file selection (for checkboxes)
  const toggleFileSelection = useCallback((file: FileInfo) => {
    setSelectedFiles((prevSelected) => {
      const isAlreadySelected = prevSelected.some((f) => f.path === file.path);

      if (isAlreadySelected) {
        return prevSelected.filter((f) => f.path !== file.path);
      }
      return [...prevSelected, file];
    });
  }, []);

  // Check if file is selected
  const isFileSelected = useCallback(
    (file: FileInfo) => {
      return selectedFiles.some((f) => f.path === file.path);
    },
    [selectedFiles]
  );

  // Clear all selected files
  const clearSelectedFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Load initial directory on mount
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadDirectory("");
    }
  }, [loadDirectory]);

  // Memoize the context value to prevent unnecessary renders
  const value = useMemo(
    () => ({
      currentPath,
      files,
      filteredFiles,
      selectedFile,
      fileContent,
      fileDiff,
      loading,
      error,
      searchQuery,
      pathHistory,
      pathForward,
      selectedFiles,
      loadDirectory,
      loadFileContent,
      navigateUp,
      goBack,
      goForward,
      goToProjectRoot,
      refreshDirectory,
      getBreadcrumbs,
      setSearchQuery,
      handleFileClick,
      toggleFileSelection,
      isFileSelected,
      clearSelectedFiles,
    }),
    [
      currentPath,
      files,
      filteredFiles,
      selectedFile,
      fileContent,
      fileDiff,
      loading,
      error,
      searchQuery,
      pathHistory,
      pathForward,
      selectedFiles,
      loadDirectory,
      loadFileContent,
      navigateUp,
      goBack,
      goForward,
      goToProjectRoot,
      refreshDirectory,
      getBreadcrumbs,
      handleFileClick,
      toggleFileSelection,
      isFileSelected,
      clearSelectedFiles,
    ]
  );

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};
