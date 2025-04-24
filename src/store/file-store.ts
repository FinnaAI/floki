import { create } from "zustand";
// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import path from "path";
import type { FileInfo, FileDiff } from "@/types/files";
import { useGitStatusStore } from "./git-status-store";

interface FileState {
  // State
  currentPath: string;
  files: FileInfo[];
  filteredFiles: FileInfo[];
  selectedFile: FileInfo | null;
  fileContent: string | null;
  fileDiff: FileDiff | null;
  loading: boolean;
  directoryLoading: boolean;
  fileLoading: boolean;
  error: string | null;
  searchQuery: string;
  pathHistory: string[];
  pathForward: string[];
  selectedFiles: Record<string, FileInfo>;
  hasInitialized: boolean;

  // Actions
  setFiles: (files: FileInfo[]) => void;
  setFilteredFiles: (files: FileInfo[]) => void;
  setCurrentPath: (path: string) => void;
  setSelectedFile: (file: FileInfo | null) => void;
  setFileContent: (content: string | null) => void;
  setFileDiff: (diff: FileDiff | null) => void;
  setLoading: (loading: boolean) => void;
  setDirectoryLoading: (loading: boolean) => void;
  setFileLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setPathHistory: (history: string[]) => void;
  setPathForward: (forward: string[]) => void;
  setInitialized: (initialized: boolean) => void;
  loadDirectory: (dirPath: string, addToHistory?: boolean) => Promise<void>;
  loadFileContent: (fileInfo: FileInfo) => Promise<void>;
  loadFileDiff: (filePath: string) => Promise<void>;
  navigateUp: () => void;
  goBack: () => void;
  goForward: () => void;
  goToProjectRoot: () => void;
  refreshDirectory: () => void;
  getBreadcrumbs: () => Array<{ name: string; path: string }>;
  handleFileClick: (file: FileInfo) => void;
  toggleFileSelection: (file: FileInfo) => void;
  isFileSelected: (file: FileInfo) => boolean;
  clearSelectedFiles: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  // Initial state
  currentPath: "",
  files: [],
  filteredFiles: [],
  selectedFile: null,
  fileContent: null,
  fileDiff: null,
  loading: true,
  directoryLoading: true,
  fileLoading: true,
  error: null,
  searchQuery: "",
  pathHistory: [],
  pathForward: [],
  selectedFiles: {},
  hasInitialized: false,

  // Basic setters
  setFiles: (files: FileInfo[]) => set({ files }),
  setFilteredFiles: (files: FileInfo[]) => set({ filteredFiles: files }),
  setCurrentPath: (path: string) => set({ currentPath: path }),
  setSelectedFile: (file: FileInfo | null) => set({ selectedFile: file }),
  setFileContent: (content: string | null) => set({ fileContent: content }),
  setFileDiff: (diff: FileDiff | null) => set({ fileDiff: diff }),
  setLoading: (loading: boolean) => set({ loading }),
  setDirectoryLoading: (loading: boolean) => set({ directoryLoading: loading }),
  setFileLoading: (loading: boolean) => set({ fileLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setSearchQuery: (query: string) => {
    // Update the search query
    set({ searchQuery: query });

    // Filter files based on the query
    const state = get();
    if (!query) {
      set({ filteredFiles: state.files });
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = state.files.filter((file) =>
      file.name.toLowerCase().includes(lowercaseQuery)
    );

    set({ filteredFiles: filtered });
  },
  setPathHistory: (history: string[]) => set({ pathHistory: history }),
  setPathForward: (forward: string[]) => set({ pathForward: forward }),
  setInitialized: (initialized: boolean) =>
    set({ hasInitialized: initialized }),

  // Action to load a directory
  loadDirectory: async (dirPath: string, addToHistory = true) => {
    const state = get();
    const { currentPath, files, directoryLoading } = state;
    const gitStore = useGitStatusStore.getState();

    console.log("loadDirectory called with path:", dirPath);

    // Prevent unnecessary reloads
    if (dirPath === "" && currentPath === "" && files.length > 0) {
      console.log("Skipping reload - already have files at root");
      return;
    }

    // Skip loading same directory twice
    if (dirPath === currentPath && !directoryLoading) {
      console.log("Skipping reload of same directory:", dirPath);
      return;
    }

    set({
      directoryLoading: true,
      loading: true, // Keep for backwards compatibility
      error: null,
      searchQuery: "",
    });

    console.log("Loading directory:", dirPath);

    // Store path for history before it changes
    const oldPath = currentPath;

    try {
      // Ensure we're passing the correct path to the API
      // Use empty string for root directory
      const pathToUse = dirPath || "";
      console.log("Using path for API:", pathToUse);

      const pathParam = encodeURIComponent(pathToUse);
      const showGitStatus = gitStore.showGitStatus;
      const showIgnoredFiles = gitStore.showIgnoredFiles;

      console.log(
        `API params: git=${showGitStatus}, showIgnored=${showIgnoredFiles}`
      );

      const url = `/api/filesystem?path=${pathParam}&git=${showGitStatus}&showIgnored=${showIgnoredFiles}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(
          `HTTP error ${response.status}: ${errorData.error || "Unknown error"}`
        );
      }

      const data = await response.json();
      console.log("API response:", data);

      // Set new directory state
      set({
        files: data.files || [],
        filteredFiles: data.files || [],
        currentPath: data.path || pathToUse,
        directoryLoading: false,
        loading: false, // Keep for backwards compatibility
      });

      // Update git component path
      gitStore.setCurrentPath(data.path || pathToUse);

      // Update navigation history if needed
      if (addToHistory && oldPath && data.path !== oldPath) {
        set((state) => ({
          pathHistory: [...state.pathHistory, oldPath],
          pathForward: [],
        }));
      }
    } catch (err) {
      console.error("Error loading directory:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to load directory",
        directoryLoading: false,
        loading: false, // Keep for backwards compatibility
      });
    }
  },

  // Action to load file content
  loadFileContent: async (fileInfo: FileInfo) => {
    const state = get();
    const gitStore = useGitStatusStore.getState();

    console.log("loadFileContent called for:", fileInfo.path);

    set({
      fileLoading: true,
      loading: true, // Keep for backwards compatibility
      error: null,
      selectedFile: fileInfo,
      fileDiff: null,
    });

    try {
      console.log("Fetching file content for:", fileInfo.path);

      const response = await fetch("/api/filesystem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: fileInfo.path }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API error response:", errorData);
        throw new Error(
          `HTTP error ${response.status}: ${errorData.error || "Unknown error"}`
        );
      }

      const data = await response.json();
      console.log(
        "File content received, size:",
        data.content?.length || 0,
        "bytes"
      );

      set({
        fileContent: data.content,
        fileLoading: false,
        loading: false, // Keep for backwards compatibility
      });

      // If git status is enabled and this file is modified, load the diff immediately
      if (
        gitStore.showGitStatus &&
        gitStore.getFileStatus(fileInfo.path) === "modified"
      ) {
        console.log("Loading diff for modified file");
        get().loadFileDiff(fileInfo.path);
      }
    } catch (err) {
      console.error("Error loading file:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to load file",
        fileContent: null,
        fileLoading: false,
        loading: false, // Keep for backwards compatibility
      });
    }
  },

  // Action to load git diff for a file
  loadFileDiff: async (filePath: string) => {
    try {
      const response = await fetch("/api/git/diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const data = await response.json();
      set({ fileDiff: data });
    } catch (err) {
      console.error("Error loading diff:", err);
      // Don't set error state here, not critical
    }
  },

  // Navigate to parent directory
  navigateUp: () => {
    const { currentPath, loadDirectory } = get();

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
      loadDirectory("");
      return;
    }

    // Otherwise go to parent directory
    loadDirectory(parentDir);
  },

  // Go back in history
  goBack: () => {
    const { pathHistory, currentPath, loadDirectory } = get();

    if (pathHistory.length === 0) return;

    const prevPath = pathHistory[pathHistory.length - 1];
    if (!prevPath) return;

    set((state) => ({
      pathHistory: state.pathHistory.slice(0, -1),
      pathForward: [currentPath, ...state.pathForward],
    }));

    // Ensure we don't add this navigation to history
    loadDirectory(prevPath, false);
  },

  // Go forward in history
  goForward: () => {
    const { pathForward, currentPath, loadDirectory } = get();

    if (pathForward.length === 0) return;

    const nextPath = pathForward[0];
    if (!nextPath) return;

    set((state) => ({
      pathForward: state.pathForward.slice(1),
      pathHistory: [...state.pathHistory, currentPath],
    }));

    // Ensure we don't add this navigation to history
    loadDirectory(nextPath, false);
  },

  // Navigate to home/project root
  goToProjectRoot: () => {
    const { loadDirectory } = get();
    loadDirectory("");
  },

  // Reload current directory
  refreshDirectory: () => {
    const { currentPath, loadDirectory } = get();
    loadDirectory(currentPath, false);
  },

  // Get breadcrumbs for navigation
  getBreadcrumbs: () => {
    const { currentPath } = get();

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
  },

  // Handle directory navigation for files
  handleFileClick: (file: FileInfo) => {
    const { loadDirectory, loadFileContent } = get();

    if (file.isDirectory) {
      loadDirectory(file.path);
    } else {
      loadFileContent(file);
    }
  },

  // Toggle file selection (for checkboxes)
  toggleFileSelection: (file: FileInfo) => {
    set((state) => {
      const newSelectedFiles = { ...state.selectedFiles };

      if (newSelectedFiles[file.path]) {
        delete newSelectedFiles[file.path];
      } else {
        newSelectedFiles[file.path] = file;
      }

      return { selectedFiles: newSelectedFiles };
    });
  },

  // Check if file is selected
  isFileSelected: (file: FileInfo) => {
    const { selectedFiles } = get();
    return !!selectedFiles[file.path];
  },

  // Clear all selected files
  clearSelectedFiles: () => {
    set({ selectedFiles: {} });
  },
}));
