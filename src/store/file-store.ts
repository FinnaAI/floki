import path from "path";
import type {
	FileInfo,
	FileSystem,
	WebFileSystem,
} from "@/interfaces/FileSystem/FileSystem";
import { createFileSystem } from "@/lib/file-system";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useIDEStore } from "@/store/ide-store";
import type { FileDiff } from "@/types/files";
import { create } from "zustand";
import { useGitStatusStore } from "./git-status-store";

// Helper to get parent path
const getParentPath = (filePath: string): string => {
	const idx = filePath.lastIndexOf("/");
	if (idx === -1) return "";
	return filePath.substring(0, idx);
};

// Create file system instance
const fileSystem = createFileSystem() as FileSystem;

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
	selectedFiles: FileInfo[];
	hasInitialized: boolean;
	needsDirectoryPermission: boolean;
	fileWatchEnabled: boolean;
	fileWatcherCleanup: (() => void) | null;

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
	setNeedsDirectoryPermission: (needs: boolean) => void;
	setFileWatchEnabled: (enabled: boolean) => void;
	loadDirectory: (
		dirPath: string,
		addToHistory?: boolean,
		forceRefresh?: boolean,
	) => Promise<void>;
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
	watchDirectory: (dirPath: string) => void;
	stopWatching: () => void;
	requestPersistentStorage: () => Promise<boolean>;
	persistDirectoryPermission: (
		handle: FileSystemDirectoryHandle,
	) => Promise<boolean>;

	// Switch project by updating folder handle
	switchProject: (projectPath: string) => Promise<void>;

	loadDirectoryChildren: (
		dirPath: string,
		forceRefresh?: boolean,
	) => Promise<void>;

	// Initialize project on startup
	initializeProject: () => Promise<void>;

	// Add these new methods
	createFile: (parentDir: string, fileName: string) => Promise<void>;
	createFolder: (parentDir: string, folderName: string) => Promise<void>;
	deleteFile: (filePath: string) => Promise<void>;
	renameItem: (oldPath: string, newName: string) => Promise<void>;
	saveFileContent: (filePath: string, content: string) => Promise<void>;

	// Add a method to save directory handles to IndexedDB
	saveDirectoryHandleToIndexedDB: (
		handle: FileSystemDirectoryHandle,
		projectPath: string,
	) => Promise<boolean>;

	// Add a method to load directory handles from IndexedDB
	loadDirectoryHandlesFromIndexedDB: () => Promise<void>;
}

// Type guard for WebFileSystem
function isWebFileSystem(fs: FileSystem): fs is WebFileSystem {
	return "folderHandle" in fs;
}

// Fix the type assertion with a more specific interface
interface FileSystemHandleWithPermission extends FileSystemDirectoryHandle {
	requestPermission(descriptor: { mode: "readwrite" | "read" }): Promise<
		"granted" | "denied" | "prompt"
	>;
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
	selectedFiles: [],
	hasInitialized: false,
	needsDirectoryPermission: false,
	fileWatchEnabled: true,
	fileWatcherCleanup: null,
	projectHandles: {},
	projectStates: {},

	// Basic setters
	setFiles: (files: FileInfo[]) => {
		set({ files });

		// Start file watching if enabled and not already watching
		const state = get();
		if (
			state.fileWatchEnabled &&
			state.currentPath &&
			!state.fileWatcherCleanup &&
			isWebFileSystem(fileSystem)
		) {
			state.watchDirectory(state.currentPath);
		}
	},
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
	setNeedsDirectoryPermission: (needs: boolean) =>
		set({ needsDirectoryPermission: needs }),
	setFileWatchEnabled: (enabled: boolean) => set({ fileWatchEnabled: enabled }),

	// Action to load a directory
	loadDirectory: async (
		dirPath: string,
		addToHistory = true,
		forceRefresh = false,
	) => {
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
		} else if (dirPath === currentPath && !directoryLoading && !forceRefresh) {
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
			} else {
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

			// Start watching the directory for changes if enabled
			if (state.fileWatchEnabled) {
				state.watchDirectory(dirPath);
			}
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

		// Check if we need to save the current file before switching
		if (state.selectedFile && state.selectedFile.path !== fileInfo.path) {
			// Attempt to get editor content from window if available
			try {
				// Use a safer approach to access Monaco editor
				const editorElement = document.querySelector("[data-monaco-editor-id]");
				if (editorElement) {
					// Define a type for Monaco editor with the properties we need
					interface MonacoEditorInstance {
						_modelData?: {
							viewModel?: {
								editor?: {
									getValue: () => string;
								};
							};
						};
					}

					// Use type assertion with a more specific type
					const editorInstance = (
						editorElement as unknown as MonacoEditorInstance
					)?._modelData?.viewModel?.editor;
					if (editorInstance && typeof editorInstance.getValue === "function") {
						const currentContent = editorInstance.getValue();
						// Save the current file before loading the new one
						await state.saveFileContent(
							state.selectedFile.path,
							currentContent,
						);
					}
				}
			} catch (err) {
				console.error("Error saving previous file:", err);
			}
		}

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
		const gitStore = useGitStatusStore.getState();
		const fileStatus = gitStore.getFileStatus(filePath);

		// Only load diff for modified files
		if (fileStatus !== "modified") {
			set({ fileDiff: null });
			return;
		}

		set({ fileLoading: true });

		try {
			const response = await fetch(
				`/api/git/diff?path=${encodeURIComponent(filePath)}`,
			);

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
		} catch (error) {
			console.error("Error loading file diff:", error);
			set({
				error:
					error instanceof Error ? error.message : "Failed to load file diff",
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
		if (isWebFileSystem(fileSystem) ? fileSystem.folderHandle : true) {
			state.loadDirectory("");
		}
	},

	// Reload current directory
	refreshDirectory: () => {
		const { currentPath, loadDirectory } = get();

		// First, if we're in a sub-directory, also refresh the parent directory
		if (currentPath) {
			const parentPath = getParentPath(currentPath);
			if (parentPath && parentPath !== currentPath) {
				console.log("Refreshing parent directory:", parentPath);
				// Load parent directory content if needed
				const fileStore = get();
				fileStore.loadDirectoryChildren(parentPath, true);
			}
		}

		console.log("Refreshing current directory:", currentPath);
		// Now refresh the current directory - force reload by passing forceRefresh=true
		loadDirectory(currentPath, false, true);
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
			const exists = state.selectedFiles.some((f) => f.path === file.path);
			const updated = exists
				? state.selectedFiles.filter((f) => f.path !== file.path)
				: [...state.selectedFiles, file];

			return { selectedFiles: updated };
		});
	},

	// Check if file is selected
	isFileSelected: (file: FileInfo) => {
		const { selectedFiles } = get();
		return selectedFiles.some((f) => f.path === file.path);
	},

	// Clear all selected files
	clearSelectedFiles: () => {
		set({ selectedFiles: [] });
	},

	// Update the openFolder method to save the handle to IndexedDB
	openFolder: async (): Promise<FileSystemDirectoryHandle | undefined> => {
		try {
			if (isWebFileSystem(fileSystem)) {
				const handle = await fileSystem.openFolder();
				if (handle) {
					set({ needsDirectoryPermission: false });
					
					// Request persistent permission for this directory handle
					await get().persistDirectoryPermission(handle);
					
					// Save handle to IndexedDB for persistence between sessions
					await get().saveDirectoryHandleToIndexedDB(handle, handle.name);
					
					await get().loadDirectory("", true);
					
					// Start watching if enabled
					const state = get();
					if (state.fileWatchEnabled) {
						state.watchDirectory("");
					}
					
					return handle;
				}
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

	// Update the openNewProject method to save the handle to IndexedDB
	openNewProject: async () => {
		try {
			if (isWebFileSystem(fileSystem)) {
				const handle = await fileSystem.openFolder();
				if (handle) {
					const projectPath = handle.name;
					
					// Request persistent permission for this directory handle
					await get().persistDirectoryPermission(handle);
					
					// Save handle to IndexedDB for persistence between sessions
					await get().saveDirectoryHandleToIndexedDB(handle, projectPath);
					
					// Store handle mapping (in-memory, not persisted)
					set((state) => ({
						projectHandles: { ...state.projectHandles, [projectPath]: handle },
					}));
					useIDEStore.getState().addProject(projectPath);
					return handle;
				}
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

		// Stop any active file watchers
		get().stopWatching();

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

	loadDirectoryChildren: async (dirPath: string, forceRefresh = false) => {
		const { files, setFiles, setFilteredFiles } = get();

		// Prevent duplicate fetch if we already have children for dirPath, unless forceRefresh is true
		const alreadyLoaded = files.some(
			(f) => f.path.startsWith(`${dirPath}/`) && f.path !== dirPath,
		);
		if (alreadyLoaded && !forceRefresh) return;

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

	// Update initializeProject method to load handles from IndexedDB first
	initializeProject: async () => {
		const ideStore = useIDEStore.getState();
		const activeProject = ideStore.activeProject;

		if (!activeProject) {
			console.log("No active project to initialize");
			set({ loading: false, directoryLoading: false });
			return;
		}

		// First, try to load handles from IndexedDB
		await get().loadDirectoryHandlesFromIndexedDB();
		
		try {
			// If we already have a handle for this project, use it
			const existingHandle = get().projectHandles[activeProject];
			if (existingHandle) {
				// Update file system handle and ensure worker gets it
				if (isWebFileSystem(fileSystem)) {
					await fileSystem.setFolderHandle(existingHandle);
				}
				
				// Check if we still have permission
				const hasPermission = await get().persistDirectoryPermission(existingHandle);
				if (hasPermission) {
					set({ needsDirectoryPermission: false });
					await get().loadDirectory("", true);
					
					// Start watching if enabled
					const state = get();
					if (state.fileWatchEnabled && isWebFileSystem(fileSystem)) {
						state.watchDirectory("");
					}
					return;
				}
			}

			// If we get here, either we don't have a handle or permission was denied
			set({
				needsDirectoryPermission: true,
				loading: false,
				directoryLoading: false,
			});
		} catch (err) {
			console.error("Error initializing project:", err);
			set({
				error: err instanceof Error ? err.message : "Failed to initialize project",
				loading: false,
				directoryLoading: false,
				needsDirectoryPermission: true,
			});
		}
	},

	// Add file creation functionality
	createFile: async (parentDir: string, fileName: string) => {
		try {
			const fullPath = parentDir ? `${parentDir}/${fileName}` : fileName;

			// Call API to create file
			const response = await fetch("/api/filesystem", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					path: fullPath,
					isDirectory: false,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create file");
			}

			// Success - reload the directory to show the new file
			console.log("File created successfully:", fullPath);

			// Add the new file to our files list immediately so UI updates
			const newFileInfo: FileInfo = {
				name: fileName,
				path: fullPath,
				isDirectory: false,
				lastModified: new Date(),
				size: 0,
			};

			set((state) => {
				// Add to existing files if not already there
				const fileExists = state.files.some((f) => f.path === fullPath);
				if (!fileExists) {
					return {
						files: [...state.files, newFileInfo],
						filteredFiles: [...state.filteredFiles, newFileInfo],
					};
				}
				return state;
			});

			// Now reload directories
			const { refreshDirectory } = get();
			refreshDirectory();
		} catch (error) {
			console.error("Error creating file:", error);
			throw error;
		}
	},

	// Add folder creation functionality
	createFolder: async (parentDir: string, folderName: string) => {
		try {
			const fullPath = parentDir ? `${parentDir}/${folderName}` : folderName;

			// Call API to create folder
			const response = await fetch("/api/filesystem", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					path: fullPath,
					isDirectory: true,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create folder");
			}

			// Success - reload the directory to show the new folder
			console.log("Folder created successfully:", fullPath);

			// Add the new folder to our files list immediately so UI updates
			const newFolderInfo: FileInfo = {
				name: folderName,
				path: fullPath,
				isDirectory: true,
				lastModified: new Date(),
				size: 0,
			};

			set((state) => {
				// Add to existing files if not already there
				const folderExists = state.files.some((f) => f.path === fullPath);
				if (!folderExists) {
					return {
						files: [...state.files, newFolderInfo],
						filteredFiles: [...state.filteredFiles, newFolderInfo],
					};
				}
				return state;
			});

			// Now reload directories
			const { refreshDirectory } = get();
			refreshDirectory();
		} catch (error) {
			console.error("Error creating folder:", error);
			throw error;
		}
	},

	// Add delete functionality
	deleteFile: async (filePath: string) => {
		try {
			// Call API to delete file or folder
			const response = await fetch(
				`/api/filesystem?path=${encodeURIComponent(filePath)}`,
				{
					method: "DELETE",
				},
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete");
			}

			// Success - reload the parent directory
			const parentDir = filePath.substring(0, filePath.lastIndexOf("/"));
			const { loadDirectory } = get();

			// If parent is empty string, we're at root
			await loadDirectory(parentDir || get().currentPath, false);

			// If the deleted file was selected, clear selection
			const { selectedFile } = get();
			if (selectedFile && selectedFile.path === filePath) {
				set({ selectedFile: null });
			}

			// Remove from selected files if it was selected
			set((state) => ({
				selectedFiles: state.selectedFiles.filter((f) => f.path !== filePath),
			}));
		} catch (error) {
			console.error("Error deleting:", error);
			throw error;
		}
	},

	// Rename file or folder
	renameItem: async (oldPath: string, newName: string) => {
		try {
			// Get parent directory path for reloading after rename
			const parentDir = oldPath.substring(0, oldPath.lastIndexOf("/"));
			const newPath = parentDir ? `${parentDir}/${newName}` : newName;

			// For UI update - determine if this was the selected file
			const { selectedFile } = get();
			const wasSelected = selectedFile?.path === oldPath;

			console.log(`Renaming ${oldPath} to ${newPath}`);

			const response = await fetch("/api/filesystem", {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					path: oldPath,
					newName,
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to rename");
			}

			// Get the rename result with the new path
			const result = await response.json();

			// If the renamed item was selected, update selection to the new path
			if (wasSelected && selectedFile) {
				// Create new FileInfo with updated path/name
				const updatedFile = {
					...selectedFile,
					path: result.path,
					name: newName,
					lastModified: new Date(result.lastModified),
				};

				// Set as selected file to update UI
				set({ selectedFile: updatedFile });
			}

			// Reload the directory to show changes
			const { loadDirectory } = get();
			await loadDirectory(parentDir || get().currentPath, false);
		} catch (error) {
			console.error("Error renaming item:", error);
			throw error;
		}
	},

	saveFileContent: async (filePath: string, content: string) => {
		const state = get();
		set({ fileLoading: true, error: null });

		try {
			// Make sure we're using the correct folder handle
			const syncHandle = () => {
				const activeProject = useIDEStore.getState().activeProject;
				if (!activeProject) return;

				const handle = get().projectHandles[activeProject];
				if (!handle) {
					console.error(
						`Handle not found for active project: ${activeProject}`,
					);
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

			// Write the file content
			await fileSystem.writeFile(filePath, content);

			// Update the store's file content
			set({
				fileContent: content,
				fileLoading: false,
				error: null,
			});

			// Refresh git status if available
			const gitStore = useGitStatusStore.getState();
			if (gitStore.showGitStatus) {
				await gitStore.fetchGitStatus();
			}
		} catch (err) {
			console.error("Error saving file:", err);
			set({
				error: err instanceof Error ? err.message : "Failed to save file",
				fileLoading: false,
			});
		}
	},

	// Request persistent storage to help with permissions
	requestPersistentStorage: async () => {
		// Check if the browser supports persistent storage
		if (!navigator.storage || !navigator.storage.persist) {
			console.log("Persistent storage not supported by browser");
			return false;
		}

		// Request persistent storage
		const isPersisted = await navigator.storage.persist();
		console.log(`Persistent storage granted: ${isPersisted}`);
		return isPersisted;
	},

	// Request persistent permissions for a directory handle
	persistDirectoryPermission: async (handle: FileSystemDirectoryHandle) => {
		try {
			// First request persistent storage to ensure file handles can be stored
			await get().requestPersistentStorage();

			// Check if we already have permission
			const options = { mode: "readwrite" as const };
			const existingPermission = await (
				handle as FileSystemHandleWithPermission
			).requestPermission(options);

			if (existingPermission === "granted") {
				console.log(
					"Already have persistent permission for directory:",
					handle.name,
				);
				return true;
			}

			// If not granted, request new permission
			const permission = await (
				handle as FileSystemHandleWithPermission
			).requestPermission(options);

			if (permission === "granted") {
				console.log(
					"Persistent permission granted for directory:",
					handle.name,
				);
				return true;
			}

			console.log("Failed to get persistent permission for directory");
			return false;
		} catch (err) {
			console.error("Error persisting directory permission:", err);
			return false;
		}
	},

	watchDirectory: (dirPath: string) => {
		const state = get();

		// Only web file system supports watching
		if (!isWebFileSystem(fileSystem) || !state.fileWatchEnabled) {
			return;
		}

		// Check if watchChanges method exists on the file system
		if (typeof fileSystem.watchChanges !== "function") {
			console.error("File system doesn't support watching for changes");
			return;
		}

		// Clean up any existing watcher first
		state.stopWatching();

		try {
			console.log("Starting file watcher for directory:", dirPath);
			const cleanup = fileSystem.watchChanges(dirPath, (changedFiles) => {
				console.log("Files changed on disk:", changedFiles);

				// Check if any of the changed files are relevant to current view
				const isRelevantChange = changedFiles.some((file) => {
					// Check if the file is in current directory
					const fileDir = getParentPath(file.path);
					return (
						fileDir === state.currentPath ||
						// Or is the currently selected file
						(state.selectedFile && file.path === state.selectedFile.path) ||
						// Or is a parent directory of current path
						state.currentPath.startsWith(`${file.path}/`)
					);
				});

				if (isRelevantChange) {
					console.log("Refreshing directory due to relevant file changes");
					state.refreshDirectory();

					// Also reload the file content if the changed file is currently selected
					const selectedFile = state.selectedFile;
					if (selectedFile) {
						const changedSelectedFile = changedFiles.find(
							(f) => f.path === selectedFile.path,
						);
						if (changedSelectedFile) {
							state.loadFileContent(selectedFile);
						}
					}
				}
			});

			// Store the cleanup function
			if (cleanup) {
				set({ fileWatcherCleanup: cleanup });
			}
		} catch (err) {
			console.error("Error setting up file watcher:", err);
		}
	},

	stopWatching: () => {
		const cleanup = get().fileWatcherCleanup;
		if (cleanup && typeof cleanup === "function") {
			console.log("Stopping file watcher");
			cleanup();
			set({ fileWatcherCleanup: null });
		}
	},

	// Add a method to save directory handles to IndexedDB
	saveDirectoryHandleToIndexedDB: async (
		handle: FileSystemDirectoryHandle,
		projectPath: string,
	) => {
		try {
			if (!window.indexedDB) {
				console.log("IndexedDB not supported by browser");
				return false;
			}

			// Open (or create) the database
			const dbPromise = indexedDB.open("floki-directory-handles", 1);

			// Create object store if it doesn't exist
			dbPromise.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains("handles")) {
					db.createObjectStore("handles", { keyPath: "path" });
				}
			};

			// Once the database is open, store the handle
			const db = await new Promise<IDBDatabase>((resolve, reject) => {
				dbPromise.onsuccess = () => resolve(dbPromise.result);
				dbPromise.onerror = () => reject(dbPromise.error);
			});

			const transaction = db.transaction("handles", "readwrite");
			const store = transaction.objectStore("handles");

			// Store the handle with the project path as key
			await new Promise<void>((resolve, reject) => {
				const request = store.put({ path: projectPath, handle });
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});

			db.close();
			console.log(`Directory handle for ${projectPath} saved to IndexedDB`);
			return true;
		} catch (err) {
			console.error("Error saving directory handle to IndexedDB:", err);
			return false;
		}
	},

	// Add a method to load directory handles from IndexedDB
	loadDirectoryHandlesFromIndexedDB: async () => {
		try {
			if (!window.indexedDB) {
				console.log("IndexedDB not supported by browser");
				return;
			}

			// Open the database
			const dbPromise = indexedDB.open("floki-directory-handles", 1);

			// Handle database opening
			const db = await new Promise<IDBDatabase>((resolve, reject) => {
				dbPromise.onsuccess = () => resolve(dbPromise.result);
				dbPromise.onerror = () => reject(dbPromise.error);

				// Create the object store if needed
				dbPromise.onupgradeneeded = (event) => {
					const db = (event.target as IDBOpenDBRequest).result;
					if (!db.objectStoreNames.contains("handles")) {
						db.createObjectStore("handles", { keyPath: "path" });
					}
				};
			});

			// Get all stored handles
			const transaction = db.transaction("handles", "readonly");
			const store = transaction.objectStore("handles");

			const storedHandles = await new Promise<
				Array<{ path: string; handle: FileSystemDirectoryHandle }>
			>((resolve, reject) => {
				const request = store.getAll();
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => reject(request.error);
			});

			// Update the project handles in the store
			if (storedHandles.length > 0) {
				const projectHandles: Record<
					string,
					FileSystemDirectoryHandle | undefined
				> = {};

				for (const { path, handle } of storedHandles) {
					projectHandles[path] = handle;
				}

				set({ projectHandles });
				console.log(
					`Loaded ${storedHandles.length} directory handles from IndexedDB`,
				);
			}

			db.close();
		} catch (err) {
			console.error("Error loading directory handles from IndexedDB:", err);
		}
	},
}));
