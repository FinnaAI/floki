import path from "path";
import { useFileStore } from "@/store/file-store";
import { create } from "zustand";

// Global interval storage
let gitStatusPollIntervalId: number | null = null;

// Constants
const IGNORED_PATTERNS = [
	".git",
	"node_modules",
	".next",
	"dist",
	"build",
	".DS_Store",
	"*.log",
	"*.swp",
];

export interface GitStatus {
	modified: string[];
	added: string[];
	untracked: string[];
	deleted: string[];
	ignored: string[];
	error?: string;
}

interface GitStatusState {
	// State
	showGitStatus: boolean;
	gitStatus: GitStatus | null;
	currentPath: string;
	error?: string;
	isPolling: boolean;
	showIgnoredFiles: boolean;

	// Actions
	toggleGitStatus: () => void;
	setCurrentPath: (path: string) => void;
	getFileStatus: (filePath: string) => string;
	cleanup: () => void;
	fetchGitStatus: (directoryPath?: string) => Promise<GitStatus | null>;
	isIgnored: (filePath: string) => boolean;
	toggleShowIgnoredFiles: () => void;
	setupFallbackPolling: () => void;
}

// Worker instance will be stored here
let gitStatusWorker: Worker | null = null;
// Unload listener reference
let unloadListener: (() => void) | null = null;

// Worker initialization function
const initWorker = (get: () => GitStatusState) => {
	if (typeof window === "undefined" || gitStatusWorker) return null;

	try {
		console.log("[GitStore] Initializing worker");

		// Create the worker with proper error handling
		const workerUrl = new URL(
			"/workers/workers/git-status.worker.js",
			window.location.origin,
		);
		console.log("[GitStore] Worker URL:", workerUrl.toString());

		gitStatusWorker = new Worker(workerUrl);

		// Add global error handler to catch worker load errors
		window.addEventListener(
			"error",
			(e) => {
				if (e.filename?.includes("git-status.worker.js")) {
					console.error("[GitStore] Worker failed to load:", e.message);
					// Only set up fallback if worker fails to load
					get().setupFallbackPolling();
				}
			},
			{ once: true },
		);

		return gitStatusWorker;
	} catch (error) {
		console.error("[GitStore] Failed to initialize worker:", error);
		// Set up fallback polling immediately if worker init fails
		get().setupFallbackPolling();
		return null;
	}
};

export const useGitStatusStore = create<GitStatusState>((set, get) => {
	// Initialize worker if we're in the browser
	if (typeof window !== "undefined") {
		// Add unload listener
		if (!unloadListener) {
			unloadListener = () => get().cleanup();
			window.addEventListener("beforeunload", unloadListener);
		}

		// Pass get to initWorker
		const worker = initWorker(get);
		if (worker) {
			worker.onmessage = (event) => {
				const { type, status, error } = event.data;
				console.log("[GitStore] Received worker message:", type);

				if (type === "gitStatusUpdate") {
					set({ gitStatus: status, error: undefined });
				} else if (type === "gitStatusError") {
					console.error("[GitStore] Worker reported error:", error);
					set({ error, gitStatus: null });
					// If we get a worker error, fall back to polling
					get().setupFallbackPolling();
				}
			};

			worker.onerror = (error) => {
				console.error(
					"[GitStore] Worker error:",
					error.message || "Unknown worker error",
				);
				set({
					error: "Git status worker error",
					gitStatus: null,
					isPolling: false,
				});

				// If worker fails, fall back to polling
				get().setupFallbackPolling();
			};
		} else {
			// If worker initialization fails, set up polling as fallback
			get().setupFallbackPolling();
		}
	}

	return {
		// Initial state
		showGitStatus: true,
		gitStatus: null,
		currentPath: "",
		error: undefined,
		isPolling: false,
		showIgnoredFiles: false,

		// Actions
		toggleGitStatus: () => {
			const currentState = get();
			const newShowStatus = !currentState.showGitStatus;
			console.log("[GitStore] Toggling git status:", newShowStatus);

			set({ showGitStatus: newShowStatus });

			if (gitStatusWorker) {
				if (newShowStatus && currentState.currentPath) {
					console.log("[GitStore] Starting git status polling");
					gitStatusWorker.postMessage({
						type: "startPolling",
						path: currentState.currentPath,
					});
					set({ isPolling: true });
				} else {
					console.log("[GitStore] Stopping git status polling");
					gitStatusWorker.postMessage({ type: "stopPolling" });
					set({ isPolling: false, gitStatus: null });
				}
			} else if (newShowStatus) {
				// No worker available, fall back to polling
				get().setupFallbackPolling();
			}
		},

		setCurrentPath: (path: string) => {
			if (!path) {
				console.warn("[GitStore] Cannot set empty path");
				return;
			}

			console.log("[GitStore] Setting current path:", path);
			set({ currentPath: path });

			// Ensure we fetch git status immediately for the new path
			void get().fetchGitStatus(path);

			// Also set up worker if available
			if (gitStatusWorker && get().showGitStatus) {
				gitStatusWorker.postMessage({ type: "setPath", path });
				gitStatusWorker.postMessage({ type: "startPolling" });
				set({ isPolling: true });
			} else if (get().showGitStatus) {
				// No worker available, fall back to polling
				get().setupFallbackPolling();
			}
		},

		getFileStatus: (filePath: string): string => {
			const { gitStatus, currentPath } = get();
			if (!gitStatus || !currentPath) return "";

			// Calculate the relative path
			let relativePath = "";
			try {
				// Get the relative path and ensure consistent path separators
				relativePath = path.relative(currentPath, filePath).replace(/\\/g, "/");

				// If the paths are identical (likely checking the project root), use basename
				if (relativePath === "") {
					relativePath = path.basename(filePath);
				}

				// For debugging
				// console.log(`[GitStatus] Finding status for file: ${filePath}`);
				// console.log(`[GitStatus]   - Current git path: ${currentPath}`);
				// console.log(
				// 	`[GitStatus]   - Calculated relative path: ${relativePath}`,
				// );
			} catch (error) {
				console.error(
					`Error calculating relative path for ${filePath}:`,
					error,
				);
				return "";
			}

			// Also check if the file path itself is in status list
			// (happens when the path is already relative to git root)
			const filePathBasename = path.basename(filePath);

			// Clean up path (remove potential trailing slash)
			const cleanedPath = relativePath.replace(/\/$/, "");

			// Try different path formats
			const pathsToCheck = [
				cleanedPath, // Relative path
				filePathBasename, // Just filename
				filePath, // Full input path
				`${cleanedPath}/`, // With trailing slash
				path.basename(currentPath), // Project root name
			];

			// Check for matches in modified files
			for (const pathToCheck of pathsToCheck) {
				if (gitStatus.modified.includes(pathToCheck)) {
					console.log(
						`[GitStatus] Found path ${pathToCheck} in modified files`,
					);
					return "modified";
				}
			}

			// Check for matches in added files
			for (const pathToCheck of pathsToCheck) {
				if (gitStatus.added.includes(pathToCheck)) {
					console.log(`[GitStatus] Found path ${pathToCheck} in added files`);
					return "added";
				}
			}

			// Check for matches in deleted files
			for (const pathToCheck of pathsToCheck) {
				if (gitStatus.deleted.includes(pathToCheck)) {
					console.log(`[GitStatus] Found path ${pathToCheck} in deleted files`);
					return "deleted";
				}
			}

			// Check for matches in untracked files
			for (const pathToCheck of pathsToCheck) {
				if (gitStatus.untracked.includes(pathToCheck)) {
					console.log(
						`[GitStatus] Found path ${pathToCheck} in untracked files`,
					);
					return "untracked";
				}
			}

			// Check if the file is inside a modified/added/etc directory
			for (const modifiedPath of gitStatus.modified) {
				if (cleanedPath.startsWith(`${modifiedPath}/`)) {
					return "modified";
				}
			}

			for (const addedPath of gitStatus.added) {
				if (cleanedPath.startsWith(`${addedPath}/`)) {
					return "added";
				}
			}

			for (const deletedPath of gitStatus.deleted) {
				if (cleanedPath.startsWith(`${deletedPath}/`)) {
					return "deleted";
				}
			}

			for (const untrackedPath of gitStatus.untracked) {
				if (cleanedPath.startsWith(`${untrackedPath}/`)) {
					return "untracked";
				}
			}

			// No status found
			return "";
		},

		isIgnored: (filePath: string): boolean => {
			const fileName = path.basename(filePath);
			const relativePath = filePath
				.replace(get().currentPath, "")
				.replace(/^\//, "");

			return IGNORED_PATTERNS.some((pattern) => {
				if (pattern.includes("*")) {
					const regex = new RegExp(`^${pattern.replace("*", ".*")}$`);
					return regex.test(fileName);
				}
				return relativePath.includes(pattern) || fileName === pattern;
			});
		},

		toggleShowIgnoredFiles: () => {
			set((state) => ({ showIgnoredFiles: !state.showIgnoredFiles }));
		},

		fetchGitStatus: async (
			directoryPath?: string,
		): Promise<GitStatus | null> => {
			const currentPath = directoryPath || get().currentPath;

			if (!currentPath) {
				console.error("[GitStore] Cannot fetch git status: No path specified");
				return null;
			}

			// console.log("[GitStore] Manually fetching git status for:", currentPath);

			try {
				// First normalize the path for API call
				let apiPath = currentPath;

				// Handle special cases for different operating systems
				if (typeof window !== "undefined") {
					// For browser environment
					const handle = useFileStore.getState().projectHandles[currentPath];
					if (handle) {
						apiPath = handle.name; // Use the handle name which contains the OS path
						// console.log("[GitStore] Using handle name as path:", apiPath);
					}
				}

				// Add showVirtualPaths=true to return both real and virtual paths
				const response = await fetch(
					`/api/git/status?path=${encodeURIComponent(apiPath)}&showVirtualPaths=true`,
				);

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`Failed to fetch git status: ${response.status} ${errorText}`,
					);
				}

				const data: GitStatus = await response.json();
				// console.log("[GitStore] Git status fetched manually:", data);
				set({ gitStatus: data, error: undefined });
				return data;
			} catch (error) {
				console.error("[GitStore] Error fetching git status:", error);
				const errorMessage =
					error instanceof Error ? error.message : "Failed to fetch git status";
				set({
					error: "Failed to fetch git status",
					gitStatus: null,
				});
				return null;
			}
		},

		cleanup: () => {
			if (gitStatusWorker) {
				// console.log("[GitStore] Cleaning up git status worker");
				gitStatusWorker.postMessage({ type: "stopPolling" });
				gitStatusWorker.terminate();
				gitStatusWorker = null;
			}

			// Also clear the interval if it exists
			if (gitStatusPollIntervalId !== null) {
				// console.log("[GitStore] Clearing polling interval");
				clearInterval(gitStatusPollIntervalId);
				gitStatusPollIntervalId = null;
			}

			// Remove event listener
			if (unloadListener) {
				window.removeEventListener("beforeunload", unloadListener);
				unloadListener = null;
			}

			set({ isPolling: false, gitStatus: null });
		},

		setupFallbackPolling: () => {
			// console.log("[GitStore] Setting up fallback polling");
			// Don't set up polling if we already have it active or if worker is running
			if (get().isPolling || gitStatusWorker) return;

			const pollInterval = 5000; // 5 seconds

			// Initial fetch
			void get().fetchGitStatus();

			// Clear any existing interval
			if (gitStatusPollIntervalId !== null) {
				clearInterval(gitStatusPollIntervalId);
			}

			// Set up interval
			gitStatusPollIntervalId = window.setInterval(() => {
				const currentPath = get().currentPath;
				if (currentPath) {
					void get().fetchGitStatus();
				}
			}, pollInterval);

			set({ isPolling: true });
		},
	};
});
