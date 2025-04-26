import type { GitStatus } from "@/store/git-status-store";

// This static version helps with debugging worker loading issues
const WORKER_VERSION = "1.0.0";
console.log(
	"[GitWorker] Initializing git status worker version:",
	WORKER_VERSION,
);

interface WorkerMessage {
	type: "startPolling" | "stopPolling" | "setPath";
	path?: string;
	pollInterval?: number;
}

let currentPath: string | null = null;
let pollInterval = 2000; // 2 seconds default
let pollTimeoutId: number | null = null;

async function fetchGitStatus() {
	if (!currentPath) {
		console.log("[GitWorker] No path set, skipping fetch");
		return;
	}

	try {
		console.log("[GitWorker] Fetching git status for path:", currentPath);
		const response = await fetch(
			`/api/git/status?path=${encodeURIComponent(currentPath)}`,
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Failed to fetch git status: ${response.status} ${errorText}`,
			);
		}

		const data: GitStatus = await response.json();

		// Log the data we received for debugging
		console.log("[GitWorker] Git status fetched:", {
			path: currentPath,
			modified: data.modified?.length || 0,
			added: data.added?.length || 0,
			deleted: data.deleted?.length || 0,
			untracked: data.untracked?.length || 0,
			firstModified: data.modified?.[0] || "none",
			firstAdded: data.added?.[0] || "none",
			firstUntracked: data.untracked?.[0] || "none",
		});

		// Send back to main thread
		self.postMessage({ type: "gitStatusUpdate", status: data });
	} catch (error) {
		console.error("[GitWorker] Error fetching git status:", error);
		self.postMessage({
			type: "gitStatusError",
			error:
				error instanceof Error ? error.message : "Failed to fetch git status",
		});
	}
}

function startPolling() {
	if (!currentPath) {
		console.log("[GitWorker] Cannot start polling without a path");
		return;
	}

	// Clear any existing poll
	stopPolling();

	console.log(
		`[GitWorker] Starting polling for path: ${currentPath} (interval: ${pollInterval}ms)`,
	);

	// Initial fetch
	void fetchGitStatus();

	// Start polling
	pollTimeoutId = self.setInterval(() => {
		void fetchGitStatus();
	}, pollInterval);
}

function stopPolling() {
	if (pollTimeoutId !== null) {
		console.log("[GitWorker] Stopping polling");
		self.clearInterval(pollTimeoutId);
		pollTimeoutId = null;
	}
}

// Handle incoming messages
self.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
	console.log("[GitWorker] Received message:", data);

	switch (data.type) {
		case "setPath":
			if (data.path !== undefined) {
				const oldPath = currentPath;
				currentPath = data.path;
				console.log(
					`[GitWorker] Path ${oldPath ? `changed from ${oldPath}` : "set"} to: ${currentPath}`,
				);
				// If we're already polling, restart with new path
				if (pollTimeoutId !== null) {
					startPolling();
				}
			}
			break;

		case "startPolling":
			if (data.pollInterval) {
				pollInterval = data.pollInterval;
			}
			startPolling();
			break;

		case "stopPolling":
			stopPolling();
			break;
	}
};

// Cleanup on worker termination
self.addEventListener("unload", () => {
	stopPolling();
});
