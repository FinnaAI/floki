import {
	type Mock,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { useGitStatusStore } from "../git-status-store";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window for worker tests
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

vi.stubGlobal("addEventListener", mockAddEventListener);
vi.stubGlobal("removeEventListener", mockRemoveEventListener);

// Mock file store
vi.mock("../file-store", () => ({
	useFileStore: {
		getState: vi.fn(() => ({
			projectHandles: {
				"/test/path": { name: "/test/path" },
			},
		})),
	},
}));

describe("Git Status Store", () => {
	beforeEach(() => {
		// Reset store state before each test
		useGitStatusStore.setState({
			showGitStatus: true,
			gitStatus: null,
			currentPath: "",
			error: undefined,
			isPolling: false,
			showIgnoredFiles: false,
		});

		// Reset mocks
		vi.clearAllMocks();
		mockFetch.mockReset();
	});

	afterEach(() => {
		// Clean up any intervals
		useGitStatusStore.getState().cleanup();
	});

	describe("Basic State Management", () => {
		it("should initialize with default state", () => {
			const state = useGitStatusStore.getState();
			expect(state.showGitStatus).toBe(true);
			expect(state.gitStatus).toBeNull();
			expect(state.currentPath).toBe("");
			expect(state.error).toBeUndefined();
			expect(state.isPolling).toBe(false);
			expect(state.showIgnoredFiles).toBe(false);
		});

		it("should toggle git status", () => {
			const { toggleGitStatus } = useGitStatusStore.getState();
			toggleGitStatus();
			expect(useGitStatusStore.getState().showGitStatus).toBe(false);
			toggleGitStatus();
			expect(useGitStatusStore.getState().showGitStatus).toBe(true);
		});

		it("should toggle show ignored files", () => {
			const { toggleShowIgnoredFiles } = useGitStatusStore.getState();
			toggleShowIgnoredFiles();
			expect(useGitStatusStore.getState().showIgnoredFiles).toBe(true);
			toggleShowIgnoredFiles();
			expect(useGitStatusStore.getState().showIgnoredFiles).toBe(false);
		});
	});

	describe("Git Status Fetching", () => {
		const mockGitStatus = {
			modified: ["file1.txt"],
			added: ["file2.txt"],
			deleted: ["file3.txt"],
			untracked: ["file4.txt"],
		};

		beforeEach(() => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockGitStatus),
			});
		});

		it("should fetch git status", async () => {
			const { fetchGitStatus } = useGitStatusStore.getState();
			await fetchGitStatus("/test/path");

			expect(mockFetch).toHaveBeenCalledWith(
				"/api/git/status?path=%2Ftest%2Fpath&showVirtualPaths=true",
			);

			const state = useGitStatusStore.getState();
			expect(state.gitStatus).toEqual(mockGitStatus);
			expect(state.error).toBeUndefined();
		});

		it("should handle fetch errors", async () => {
			mockFetch.mockRejectedValue(new Error("Failed to fetch"));

			const { fetchGitStatus } = useGitStatusStore.getState();
			await fetchGitStatus("/test/path");

			const state = useGitStatusStore.getState();
			expect(state.gitStatus).toBeNull();
			expect(state.error).toBe("Failed to fetch git status");
		});
	});

	describe("File Status Detection", () => {
		beforeEach(() => {
			useGitStatusStore.setState({
				gitStatus: {
					modified: ["src/file1.txt", "src/folder/file2.txt"],
					added: ["src/new.txt"],
					deleted: ["src/gone.txt"],
					untracked: ["src/untracked.txt"],
				},
				currentPath: "/test/path",
			});
		});

		it("should detect modified files", () => {
			const { getFileStatus } = useGitStatusStore.getState();
			expect(getFileStatus("/test/path/src/file1.txt")).toBe("modified");
			expect(getFileStatus("/test/path/src/folder/file2.txt")).toBe("modified");
		});

		it("should detect added files", () => {
			const { getFileStatus } = useGitStatusStore.getState();
			expect(getFileStatus("/test/path/src/new.txt")).toBe("added");
		});

		it("should detect deleted files", () => {
			const { getFileStatus } = useGitStatusStore.getState();
			expect(getFileStatus("/test/path/src/gone.txt")).toBe("deleted");
		});

		it("should detect untracked files", () => {
			const { getFileStatus } = useGitStatusStore.getState();
			expect(getFileStatus("/test/path/src/untracked.txt")).toBe("untracked");
		});

		it("should return empty string for unchanged files", () => {
			const { getFileStatus } = useGitStatusStore.getState();
			expect(getFileStatus("/test/path/src/normal.txt")).toBe("");
		});
	});

	describe("Ignored Files", () => {
		it("should detect ignored patterns", () => {
			const { isIgnored } = useGitStatusStore.getState();
			expect(isIgnored("node_modules/package.json")).toBe(true);
			expect(isIgnored(".git/config")).toBe(true);
			expect(isIgnored("build/output.js")).toBe(true);
			expect(isIgnored(".DS_Store")).toBe(true);
			expect(isIgnored("error.log")).toBe(true);
		});

		it("should not mark regular files as ignored", () => {
			const { isIgnored } = useGitStatusStore.getState();
			expect(isIgnored("src/components/app.tsx")).toBe(false);
			expect(isIgnored("package.json")).toBe(false);
			expect(isIgnored("README.md")).toBe(false);
		});
	});

	describe("Polling Mechanism", () => {
		let originalState: ReturnType<typeof useGitStatusStore.getState>;
		let mockSetInterval: Mock;

		beforeEach(() => {
			vi.useFakeTimers();
			// Save original state
			originalState = useGitStatusStore.getState();
			// Mock fetchGitStatus to avoid double calls
			const mockFetchGitStatus = vi.fn();
			// Mock setInterval
			mockSetInterval = vi.fn((callback, ms) => {
				return 123; // Return a dummy interval ID
			});
			vi.stubGlobal("setInterval", mockSetInterval);
			// Set up a clean test state
			useGitStatusStore.setState({
				...originalState,
				fetchGitStatus: mockFetchGitStatus,
				currentPath: "/test/path",
				isPolling: false,
				showGitStatus: true,
			});
			// Ensure no worker is running
			vi.stubGlobal("gitStatusWorker", null);
		});

		afterEach(() => {
			vi.useRealTimers();
			// Restore original state
			useGitStatusStore.setState(originalState);
			vi.unstubAllGlobals();
		});

		it("should set up polling when worker is not available", () => {
			const store = useGitStatusStore.getState();
			store.setupFallbackPolling();

			expect(store.isPolling).toBe(true);
			expect(store.fetchGitStatus).toHaveBeenCalledTimes(1);

			// Fast-forward time to trigger next poll
			vi.advanceTimersByTime(5000);
			expect(store.fetchGitStatus).toHaveBeenCalledTimes(2);
		});

		it("should clean up polling on cleanup", () => {
			const store = useGitStatusStore.getState();
			store.setupFallbackPolling();
			store.cleanup();

			expect(store.isPolling).toBe(false);
			vi.advanceTimersByTime(5000);
			expect(store.fetchGitStatus).toHaveBeenCalledTimes(1); // Only the initial fetch
		});
	});
});
