import type { FileInfo } from "@/interfaces/FileSystem/FileSystem";

interface WorkerMessage {
	type: string;
	path?: string;
	recursive?: boolean;
	messageId?: string;
	handle?: FileSystemDirectoryHandle;
	pollInterval?: number;
}

let folderHandle: FileSystemDirectoryHandle | null = null;
const fileCache = new Map<string, FileInfo>();
let pollInterval = 2000; // Default 2 seconds

// Add type for directory handle entries
interface FileSystemDirectoryHandleWithValues
	extends FileSystemDirectoryHandle {
	values(): AsyncIterableIterator<
		FileSystemFileHandle | FileSystemDirectoryHandle
	>;
}

// Helper to get file info
async function getFileInfo(
	entry: FileSystemHandle,
	name: string,
	path: string,
): Promise<FileInfo> {
	const isDirectory = entry.kind === "directory";
	const info: FileInfo = {
		name,
		path,
		isDirectory,
		size: 0,
		lastModified: new Date(),
	};

	if (!isDirectory) {
		try {
			const file = await (entry as FileSystemFileHandle).getFile();
			info.size = file.size;
			info.lastModified = new Date(file.lastModified);
		} catch (error) {
			console.error(`Error getting file info for ${path}:`, error);
		}
	}

	return info;
}

async function getDirHandleFromPath(
	dirPath = "",
): Promise<FileSystemDirectoryHandle> {
	console.log("[Worker] Getting directory handle for path:", dirPath);
	if (!folderHandle) throw new Error("No folder selected");

	// strip leading folder name (e.g. "floki/")
	const rootName = folderHandle.name;
	console.log("[Worker] Root folder name:", rootName);
	const relativePath = dirPath.startsWith(`${rootName}/`)
		? dirPath.slice(rootName.length + 1)
		: dirPath;
	console.log("[Worker] Relative path:", relativePath);

	if (relativePath === "" || relativePath === rootName) return folderHandle;

	let current: FileSystemDirectoryHandle = folderHandle;
	for (const part of relativePath.split("/").filter(Boolean)) {
		console.log("[Worker] Getting directory handle for part:", part);
		current = await current.getDirectoryHandle(part);
	}
	return current;
}

async function listFilesRecursively(dirPath = ""): Promise<FileInfo[]> {
	const dirHandle = await getDirHandleFromPath(dirPath);
	const files: FileInfo[] = [];
	const queue: [FileSystemDirectoryHandle, string][] = [[dirHandle, dirPath]];

	while (queue.length > 0) {
		const currentItem = queue.shift();
		if (!currentItem) continue;

		const [currentHandle, currentPath] = currentItem;
		const effectivePath = currentPath || currentHandle.name;

		try {
			const handle = currentHandle as FileSystemDirectoryHandleWithValues;
			for await (const entry of handle.values()) {
				const entryPath = effectivePath
					? `${effectivePath}/${entry.name}`
					: entry.name;
				const fileInfo = await getFileInfo(entry, entry.name, entryPath);
				files.push(fileInfo);

				if (entry.kind === "directory") {
					queue.push([entry, entryPath]);
				}
			}
		} catch (error) {
			console.error(`Error listing files in ${currentPath}:`, error);
		}
	}

	return files;
}

async function listFilesNonRecursively(dirPath = ""): Promise<FileInfo[]> {
	console.log("[Worker] Listing files non-recursively for path:", dirPath);
	const dirHandle = await getDirHandleFromPath(dirPath);
	const files: FileInfo[] = [];

	try {
		console.log("[Worker] Starting to list directory contents");
		const handle = dirHandle as FileSystemDirectoryHandleWithValues;
		for await (const entry of handle.values()) {
			const entryPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;
			console.log("[Worker] Processing entry:", entryPath);
			const fileInfo = await getFileInfo(entry, entry.name, entryPath);
			files.push(fileInfo);
		}
		console.log("[Worker] Found", files.length, "files in directory");
	} catch (error) {
		console.error("[Worker] Error listing files in", dirPath, ":", error);
	}

	return files;
}

async function detectChanges(path: string): Promise<FileInfo[]> {
	console.log("[Worker] Detecting changes for path:", path);
	if (!folderHandle) return [];

	const newFiles = await listFilesNonRecursively(path);
	const changes: FileInfo[] = [];
	const newCache = new Map<string, FileInfo>();

	// Check for new or modified files
	for (const file of newFiles) {
		const cached = fileCache.get(file.path);
		newCache.set(file.path, file);

		if (
			!cached ||
			cached.lastModified.getTime() !== file.lastModified.getTime() ||
			cached.size !== file.size
		) {
			console.log("[Worker] Change detected for file:", file.path);
			changes.push(file);
		}
	}

	// Check for deleted files
	for (const [path, file] of fileCache) {
		if (!newCache.has(path)) {
			console.log("[Worker] File deleted:", path);
			changes.push({ ...file, deleted: true });
		}
	}

	// Update cache
	fileCache.clear();
	newCache.forEach((value, key) => fileCache.set(key, value));

	if (changes.length > 0) {
		console.log("[Worker] Total changes detected:", changes.length);
	}

	return changes;
}

self.onmessage = async ({ data }: MessageEvent<WorkerMessage>) => {
	console.log("[Worker] Received message:", data.type);

	switch (data.type) {
		case "setFolder": {
			if (data.handle) {
				console.log("[Worker] Setting new folder handle");
				fileCache.clear();
				folderHandle = data.handle;
				// Immediately list files after setting folder
				const files = await listFilesNonRecursively("");
				self.postMessage({
					type: "fileList",
					files,
					messageId: "initial",
				});
			}
			break;
		}

		case "setPollInterval": {
			if (data.pollInterval) {
				console.log("[Worker] Setting new poll interval:", data.pollInterval);
				pollInterval = data.pollInterval;
			}
			break;
		}

		case "listFiles": {
			if (!folderHandle || !data.messageId) {
				console.error("[Worker] No folder selected or missing messageId");
				self.postMessage({
					type: "error",
					error: "No folder selected",
					messageId: data.messageId,
				});
				break;
			}

			try {
				console.log("[Worker] Listing files for path:", data.path);
				const files = await listFilesNonRecursively(data.path || "");

				self.postMessage({
					type: "fileList",
					files,
					messageId: data.messageId,
				});
			} catch (error) {
				console.error("[Worker] Error listing files:", error);
				self.postMessage({
					type: "error",
					error:
						error instanceof Error ? error.message : "Failed to list files",
					messageId: data.messageId,
				});
			}
			break;
		}

		case "watchChanges": {
			if (!folderHandle || !data.messageId) {
				console.error("[Worker] Cannot watch changes - no folder or messageId");
				break;
			}

			console.log("[Worker] Starting file watch for path:", data.path);
			const watchInterval = setInterval(async () => {
				try {
					const changes = await detectChanges(data.path || "");
					if (changes.length > 0) {
						console.log("[Worker] Sending changes to main thread");
						self.postMessage({
							type: "changes",
							changes,
							messageId: data.messageId,
						});
					}
				} catch (error) {
					console.error("[Worker] Error watching changes:", error);
				}
			}, pollInterval);

			// Store interval ID for cleanup
			const cleanupMessageId = `cleanup_${data.messageId}`;
			self.onmessage = ({ data: stopData }: MessageEvent<WorkerMessage>) => {
				if (
					stopData.type === "stopWatching" &&
					stopData.messageId === cleanupMessageId
				) {
					console.log("[Worker] Stopping file watch");
					clearInterval(watchInterval);
				}
			};
			break;
		}
	}
};
