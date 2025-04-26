import path from "path";
import { createFileSystem } from "@/lib/file-system";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useIDEStore } from "@/store/ide-store";
import { create } from "zustand";
import { useGitStatusStore } from "./git-status-store";
// Create file system instance
const fileSystem = createFileSystem();
// Type guard for WebFileSystem
function isWebFileSystem(fs) {
    return "folderHandle" in fs;
}
export const useFileStore = create((set, get) => ({
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
    needsDirectoryPermission: false,
    projectHandles: {},
    projectStates: {},
    // Basic setters
    setFiles: (files) => set({ files }),
    setFilteredFiles: (files) => set({ filteredFiles: files }),
    setCurrentPath: (path) => set({ currentPath: path }),
    setSelectedFile: (file) => set({ selectedFile: file }),
    setFileContent: (content) => set({ fileContent: content }),
    setFileDiff: (diff) => set({ fileDiff: diff }),
    setLoading: (loading) => set({ loading }),
    setDirectoryLoading: (loading) => set({ directoryLoading: loading }),
    setFileLoading: (loading) => set({ fileLoading: loading }),
    setError: (error) => set({ error }),
    setSearchQuery: (query) => {
        // Update the search query
        set({ searchQuery: query });
        // Filter files based on the query
        const state = get();
        if (!query) {
            set({ filteredFiles: state.files });
            return;
        }
        const lowercaseQuery = query.toLowerCase();
        const filtered = state.files.filter((file) => file.name.toLowerCase().includes(lowercaseQuery));
        set({ filteredFiles: filtered });
    },
    setPathHistory: (history) => set({ pathHistory: history }),
    setPathForward: (forward) => set({ pathForward: forward }),
    setInitialized: (initialized) => set({ hasInitialized: initialized }),
    setNeedsDirectoryPermission: (needs) => set({ needsDirectoryPermission: needs }),
    // Action to load a directory
    loadDirectory: async (dirPath, addToHistory = true) => {
        const state = get();
        const { currentPath, files, directoryLoading } = state;
        const gitStore = useGitStatusStore.getState();
        // Check if we have access to files
        if (isWebFileSystem(fileSystem)) {
            if (!fileSystem.folderHandle) {
                set({ error: "No folder selected" });
                return;
            }
        }
        // Don't skip reload if we're initializing with empty path
        if (dirPath === "" && currentPath === "" && !state.hasInitialized) {
            console.log("Initial load at root");
        }
        else if (dirPath === currentPath && !directoryLoading) {
            console.log("Skipping reload of same directory:", dirPath);
            return;
        }
        set({
            directoryLoading: true,
            loading: true,
            error: null,
            searchQuery: "",
        });
        console.log("Loading directory:", dirPath);
        // Store path for history before it changes
        const oldPath = currentPath;
        try {
            const files = await fileSystem.listFiles(dirPath || "", false);
            // Set new directory state
            set({
                files,
                filteredFiles: files,
                currentPath: dirPath,
                directoryLoading: false,
                loading: false,
                hasInitialized: true,
                error: null,
            });
            // Update git status
            if (dirPath) {
                // Create absolute path using the folderHandle path or currentPath
                const absolutePath = isWebFileSystem(fileSystem)
                    ? fileSystem.folderHandle?.name || dirPath
                    : dirPath;
                console.log("Setting Git absolute path:", absolutePath);
                gitStore.setCurrentPath(absolutePath);
            }
            else {
                // If at project root, use the folderHandle name or currentPath as the absolute path
                const absolutePath = isWebFileSystem(fileSystem)
                    ? fileSystem.folderHandle?.name || ""
                    : dirPath;
                if (absolutePath) {
                    console.log("Setting Git status to project root:", absolutePath);
                    gitStore.setCurrentPath(absolutePath);
                }
            }
            await gitStore.fetchGitStatus();
            // Update navigation history if needed
            if (addToHistory && oldPath && dirPath !== oldPath) {
                set((state) => ({
                    pathHistory: [...state.pathHistory, oldPath],
                    pathForward: [],
                }));
            }
            // Update file tree store's filtered files
            useFileTreeStore.getState().setFilteredFiles(files);
        }
        catch (err) {
            console.error("Error loading directory:", err);
            set({
                error: err instanceof Error ? err.message : "Failed to load directory",
                directoryLoading: false,
                loading: false,
            });
        }
    },
    // Action to load file content
    loadFileContent: async (fileInfo) => {
        const state = get();
        const gitStore = useGitStatusStore.getState();
        // Make sure we're using the correct folder handle before any file operation
        const syncHandle = () => {
            const activeProject = useIDEStore.getState().activeProject;
            if (!activeProject)
                return;
            const handle = get().projectHandles[activeProject];
            if (!handle) {
                console.error(`Handle not found for active project: ${activeProject}`);
                return;
            }
            // Update file system handle
            console.log(`Syncing file system handle to match active project: ${activeProject}`);
            fileSystem.folderHandle = handle;
        };
        syncHandle();
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
            const { content, info } = await fileSystem.readFile(fileInfo.path);
            set({
                fileContent: content,
                fileLoading: false,
                loading: false, // Keep for backwards compatibility
            });
            // If git status is enabled and this file is modified, load the diff immediately
            if (gitStore.showGitStatus &&
                gitStore.getFileStatus(fileInfo.path) === "modified") {
                console.log("Loading diff for modified file");
                get().loadFileDiff(fileInfo.path);
            }
        }
        catch (err) {
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
    loadFileDiff: async (filePath) => {
        const gitStore = useGitStatusStore.getState();
        const fileStatus = gitStore.getFileStatus(filePath);
        // Only load diff for modified files
        if (fileStatus !== "modified") {
            set({ fileDiff: null });
            return;
        }
        set({ fileLoading: true });
        try {
            const response = await fetch(`/api/git/diff?path=${encodeURIComponent(filePath)}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to load diff: ${response.status} ${errorText}`);
            }
            const diffData = await response.json();
            set({
                fileDiff: {
                    oldContent: diffData.oldContent,
                    newContent: diffData.newContent,
                    hunks: diffData.hunks,
                },
                fileLoading: false,
            });
        }
        catch (error) {
            console.error("Error loading file diff:", error);
            set({
                error: error instanceof Error ? error.message : "Failed to load file diff",
                fileLoading: false,
                fileDiff: null,
            });
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
        if (parentDir === currentPath ||
            parentDir === path.parse(currentPath).root) {
            loadDirectory("");
            return;
        }
        // Otherwise go to parent directory
        loadDirectory(parentDir);
    },
    // Go back in history
    goBack: () => {
        const { pathHistory, currentPath, loadDirectory } = get();
        if (pathHistory.length === 0)
            return;
        const prevPath = pathHistory[pathHistory.length - 1];
        if (!prevPath)
            return;
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
        if (pathForward.length === 0)
            return;
        const nextPath = pathForward[0];
        if (!nextPath)
            return;
        set((state) => ({
            pathForward: state.pathForward.slice(1),
            pathHistory: [...state.pathHistory, currentPath],
        }));
        // Ensure we don't add this navigation to history
        loadDirectory(nextPath, false);
    },
    // Navigate to home/project root
    goToProjectRoot: () => {
        const state = get();
        // Only try to load directory if we have a folder handle (in browser) or if we're in server mode
        if (isWebFileSystem(fileSystem) ? fileSystem.folderHandle : true) {
            state.loadDirectory("");
        }
    },
    // Reload current directory
    refreshDirectory: () => {
        const { currentPath, loadDirectory } = get();
        loadDirectory(currentPath, false);
    },
    // Get breadcrumbs for navigation
    getBreadcrumbs: () => {
        const { currentPath } = get();
        if (!currentPath)
            return [{ name: "project root", path: "" }];
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
    handleFileClick: (file) => {
        const { loadDirectory, loadFileContent } = get();
        if (file.isDirectory) {
            loadDirectory(file.path);
        }
        else {
            loadFileContent(file);
        }
    },
    // Toggle file selection (for checkboxes)
    toggleFileSelection: (file) => {
        set((state) => {
            const newSelectedFiles = { ...state.selectedFiles };
            if (newSelectedFiles[file.path]) {
                delete newSelectedFiles[file.path];
            }
            else {
                newSelectedFiles[file.path] = file;
            }
            return { selectedFiles: newSelectedFiles };
        });
    },
    // Check if file is selected
    isFileSelected: (file) => {
        const { selectedFiles } = get();
        return !!selectedFiles[file.path];
    },
    // Clear all selected files
    clearSelectedFiles: () => {
        set({ selectedFiles: {} });
    },
    // Add new method to handle folder opening
    openFolder: async () => {
        try {
            if (isWebFileSystem(fileSystem)) {
                const handle = await fileSystem.openFolder();
                if (handle) {
                    set({ needsDirectoryPermission: false });
                    await get().loadDirectory("", true);
                    return handle;
                }
            }
            return undefined;
        }
        catch (err) {
            console.error("Error opening folder:", err);
            set({
                error: err instanceof Error ? err.message : "Failed to open folder",
                directoryLoading: false,
                loading: false,
            });
            return undefined;
        }
    },
    // Add new method to handle project opening
    openNewProject: async () => {
        try {
            if (isWebFileSystem(fileSystem)) {
                const handle = await fileSystem.openFolder();
                if (handle) {
                    const projectPath = handle.name;
                    // Store handle mapping (in-memory, not persisted)
                    set((state) => ({
                        projectHandles: { ...state.projectHandles, [projectPath]: handle },
                    }));
                    useIDEStore.getState().addProject(projectPath);
                    return handle;
                }
            }
            return undefined;
        }
        catch (err) {
            console.error("Error opening project:", err);
            set({
                error: err instanceof Error ? err.message : "Failed to open project",
                directoryLoading: false,
                loading: false,
            });
            return undefined;
        }
    },
    // Switch project implementation
    switchProject: async (projectPath) => {
        const { projectHandles } = get();
        // Save snapshot of current project before switching
        const prevProject = useIDEStore.getState().activeProject;
        if (prevProject) {
            const currentHandle = fileSystem.folderHandle;
            set((state) => ({
                projectStates: {
                    ...state.projectStates,
                    [prevProject]: {
                        rootFolderName: currentHandle?.name || "",
                        files: state.files,
                        filteredFiles: state.filteredFiles,
                        currentPath: state.currentPath,
                        selectedFile: state.selectedFile,
                        fileContent: state.fileContent,
                        fileDiff: state.fileDiff,
                    },
                },
            }));
        }
        // First update the active project in IDE store
        useIDEStore.getState().setActiveProject(projectPath);
        const handle = projectHandles[projectPath];
        if (!handle) {
            console.error("Handle not found for project", projectPath);
            return;
        }
        // RESET COMPLETELY: First reset the state to avoid any stale data
        set({
            files: [],
            filteredFiles: [],
            currentPath: "",
            selectedFile: null,
            fileContent: null,
            fileDiff: null,
            directoryLoading: true,
            loading: true,
            error: null,
        });
        // Update file system handle
        console.log(`Setting file system handle to project: ${projectPath}`);
        fileSystem.folderHandle = handle;
        // Force refresh FileTree state too
        useFileTreeStore.getState().clearSearch();
        useFileTreeStore.getState().setFilteredFiles([]);
        // Retrieve snapshot if available
        const snapshot = get().projectStates[projectPath];
        if (snapshot) {
            console.log(`Restoring project snapshot for "${projectPath}"`);
            // Now load the directory to ensure everything is fresh
            await get().loadDirectory("", false);
        }
        else {
            console.log(`No snapshot found for "${projectPath}", doing fresh load`);
            // Do a fresh load if no snapshot
            await get().loadDirectory("", true);
        }
    },
    loadDirectoryChildren: async (dirPath) => {
        const { files, setFiles, setFilteredFiles } = get();
        // Prevent duplicate fetch if we already have children for dirPath
        const alreadyLoaded = files.some((f) => f.path.startsWith(`${dirPath}/`) && f.path !== dirPath);
        if (alreadyLoaded)
            return;
        try {
            // Fetch direct children (non-recursive)
            const childFiles = await fileSystem.listFiles(dirPath || "", false);
            // Merge while avoiding duplicates
            const merged = [...files];
            for (const cf of childFiles) {
                if (!merged.some((mf) => mf.path === cf.path)) {
                    merged.push(cf);
                }
            }
            setFiles(merged);
            // Keep filteredFiles in sync – apply current search query filter if exists
            const { searchQuery } = get();
            if (searchQuery) {
                const lowercaseQuery = searchQuery.toLowerCase();
                setFilteredFiles(merged.filter((file) => file.name.toLowerCase().includes(lowercaseQuery)));
            }
            else {
                setFilteredFiles(merged);
            }
        }
        catch (err) {
            console.error("Error loading directory children:", err);
            set({
                error: err instanceof Error ? err.message : "Failed to load directory",
            });
        }
    },
    // Initialize project on startup
    initializeProject: async () => {
        const ideStore = useIDEStore.getState();
        const activeProject = ideStore.activeProject;
        if (!activeProject) {
            console.log("No active project to initialize");
            set({ loading: false, directoryLoading: false });
            return;
        }
        // For web, handle directory permission
        try {
            // If we already have a handle for this project, use it
            const existingHandle = get().projectHandles[activeProject];
            if (existingHandle) {
                fileSystem.folderHandle = existingHandle;
                await get().loadDirectory("", true);
                return;
            }
            // Otherwise, mark that we need permission
            set({
                needsDirectoryPermission: true,
                loading: false,
                directoryLoading: false,
            });
        }
        catch (err) {
            console.error("Error initializing project:", err);
            set({
                error: err instanceof Error ? err.message : "Failed to initialize project",
                loading: false,
                directoryLoading: false,
            });
        }
    },
}));
