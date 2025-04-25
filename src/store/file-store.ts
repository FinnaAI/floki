import path from "path";
import { createFileSystem } from "@/lib/file-system";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useIDEStore } from "@/store/ide-store";
import type { FileDiff, FileInfo } from "@/types/files";
import { create } from "zustand";
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

	// Map of project path to directory handle
	projectHandles: Record<string, FileSystemDirectoryHandle | undefined>;
	// cached per-project state so switching tabs is instant
	projectStates: Record<
		string,
		{
			rootFolderName: string; // Store the root folder name for path normalization
			files: FileInfo[];
			filteredFiles: FileInfo[];
			currentPath: string;
			selectedFile: FileInfo | null;
			fileContent: string | null;
			fileDiff: FileDiff | null;
		}
	>;

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
	openFolder: () => Promise<FileSystemDirectoryHandle | undefined>;
	openNewProject: () => Promise<FileSystemDirectoryHandle | undefined>;

	// Switch project by updating folder handle
	switchProject: (projectPath: string) => Promise<void>;

	loadDirectoryChildren: (dirPath: string) => Promise<void>;
}

// Create file system instance
const fileSystem = createFileSystem();

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
	projectHandles: {},
	projectStates: {},

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
			file.name.toLowerCase().includes(lowercaseQuery),
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

		// Make sure we're using the correct folder handle before any file operation
		const syncHandle = () => {
			const activeProject = useIDEStore.getState().activeProject;
			if (!activeProject) return;

			const handle = get().projectHandles[activeProject];
			if (!handle) {
				console.error(`Handle not found for active project: ${activeProject}`);
				return;
			}

			// Update file system handle
			console.log(
				`Syncing file system handle to match active project: ${activeProject}`,
			);
			(
				fileSystem as unknown as { folderHandle?: FileSystemDirectoryHandle }
			).folderHandle = handle;
		};

		syncHandle();

		console.log("loadDirectory called with path:", dirPath);

		// Check if we have access to files
		if (!fileSystem.folderHandle && fileSystem.openFolder) {
			set({ error: "No folder selected" });
			return;
		}

		// Don't skip reload if we're initializing with empty path
		if (dirPath === "" && currentPath === "" && !state.hasInitialized) {
			console.log("Initial load at root");
		} else if (dirPath === currentPath && !directoryLoading) {
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
			gitStore.setCurrentPath(dirPath);
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
		} catch (err) {
			console.error("Error loading directory:", err);
			set({
				error: err instanceof Error ? err.message : "Failed to load directory",
				directoryLoading: false,
				loading: false,
			});
		}
	},

	// Action to load file content
	loadFileContent: async (fileInfo: FileInfo) => {
		const state = get();
		const gitStore = useGitStatusStore.getState();

		// Make sure we're using the correct folder handle before any file operation
		const syncHandle = () => {
			const activeProject = useIDEStore.getState().activeProject;
			if (!activeProject) return;

			const handle = get().projectHandles[activeProject];
			if (!handle) {
				console.error(`Handle not found for active project: ${activeProject}`);
				return;
			}

			// Update file system handle
			console.log(
				`Syncing file system handle to match active project: ${activeProject}`,
			);
			(
				fileSystem as unknown as { folderHandle?: FileSystemDirectoryHandle }
			).folderHandle = handle;
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
		const state = get();
		// Only try to load directory if we have a folder handle (in browser) or if we're in server mode
		if (fileSystem.folderHandle || !fileSystem.openFolder) {
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

	// Add new method to handle folder opening
	openFolder: async () => {
		try {
			const handle = await fileSystem.openFolder?.();
			if (handle) {
				await get().loadDirectory("", true);
				return handle;
			}
			return undefined;
		} catch (err) {
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
			const handle = await fileSystem.openFolder?.();
			if (handle) {
				const projectPath = handle.name;
				// Store handle mapping (in-memory, not persisted)
				set((state) => ({
					projectHandles: { ...state.projectHandles, [projectPath]: handle },
				}));
				useIDEStore.getState().addProject(projectPath);
				// Update file system handle
				(
					fileSystem as unknown as { folderHandle?: FileSystemDirectoryHandle }
				).folderHandle = handle;
				await get().loadDirectory("", true);
				return handle;
			}
			return undefined;
		} catch (err) {
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
	switchProject: async (projectPath: string) => {
		const { projectHandles } = get();

		// Save snapshot of current project before switching
		const prevProject = useIDEStore.getState().activeProject;
		if (prevProject) {
			const currentHandle = (
				fileSystem as unknown as { folderHandle?: FileSystemDirectoryHandle }
			).folderHandle;
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
		(
			fileSystem as unknown as { folderHandle?: FileSystemDirectoryHandle }
		).folderHandle = handle;

		// Force refresh FileTree state too
		useFileTreeStore.getState().clearSearch();
		useFileTreeStore.getState().setFilteredFiles([]);

		// Retrieve snapshot if available
		const snapshot = get().projectStates[projectPath];

		if (snapshot) {
			console.log(`Restoring project snapshot for "${projectPath}"`);

			// Now load the directory to ensure everything is fresh
			await get().loadDirectory("", false);
		} else {
			console.log(`No snapshot found for "${projectPath}", doing fresh load`);
			// Do a fresh load if no snapshot
			await get().loadDirectory("", true);
		}
	},

	loadDirectoryChildren: async (dirPath: string) => {
		const { files, setFiles, setFilteredFiles } = get();

		// Prevent duplicate fetch if we already have children for dirPath
		const alreadyLoaded = files.some(
			(f) => f.path.startsWith(`${dirPath}/`) && f.path !== dirPath,
		);
		if (alreadyLoaded) return;

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
				setFilteredFiles(
					merged.filter((file) =>
						file.name.toLowerCase().includes(lowercaseQuery),
					),
				);
			} else {
				setFilteredFiles(merged);
			}
		} catch (err) {
			console.error("Error loading directory children:", err);
			set({
				error: err instanceof Error ? err.message : "Failed to load directory",
			});
		}
	},
}));
