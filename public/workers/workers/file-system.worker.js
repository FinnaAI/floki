let folderHandle = null;
const fileCache = new Map();
let pollInterval = 2000; // Default 2 seconds
// Helper to get file info
async function getFileInfo(entry, name, path) {
    const isDirectory = entry.kind === "directory";
    const info = {
        name,
        path,
        isDirectory,
        size: 0,
        lastModified: new Date(),
    };
    if (!isDirectory) {
        try {
            const file = await entry.getFile();
            info.size = file.size;
            info.lastModified = new Date(file.lastModified);
        }
        catch (error) {
            console.error(`Error getting file info for ${path}:`, error);
        }
    }
    return info;
}
async function getDirHandleFromPath(dirPath = "") {
    console.log("[Worker] Getting directory handle for path:", dirPath);
    if (!folderHandle)
        throw new Error("No folder selected");
    // strip leading folder name (e.g. "floki/")
    const rootName = folderHandle.name;
    console.log("[Worker] Root folder name:", rootName);
    const relativePath = dirPath.startsWith(`${rootName}/`)
        ? dirPath.slice(rootName.length + 1)
        : dirPath;
    console.log("[Worker] Relative path:", relativePath);
    if (relativePath === "" || relativePath === rootName)
        return folderHandle;
    let current = folderHandle;
    for (const part of relativePath.split("/").filter(Boolean)) {
        console.log("[Worker] Getting directory handle for part:", part);
        current = await current.getDirectoryHandle(part);
    }
    return current;
}
async function listFilesRecursively(dirPath = "") {
    const dirHandle = await getDirHandleFromPath(dirPath);
    const files = [];
    const queue = [[dirHandle, dirPath]];
    while (queue.length > 0) {
        const currentItem = queue.shift();
        if (!currentItem)
            continue;
        const [currentHandle, currentPath] = currentItem;
        const effectivePath = currentPath || currentHandle.name;
        try {
            const handle = currentHandle;
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
        }
        catch (error) {
            console.error(`Error listing files in ${currentPath}:`, error);
        }
    }
    return files;
}
async function listFilesNonRecursively(dirPath = "") {
    console.log("[Worker] Listing files non-recursively for path:", dirPath);
    const dirHandle = await getDirHandleFromPath(dirPath);
    const files = [];
    try {
        console.log("[Worker] Starting to list directory contents");
        const handle = dirHandle;
        for await (const entry of handle.values()) {
            const entryPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;
            console.log("[Worker] Processing entry:", entryPath);
            const fileInfo = await getFileInfo(entry, entry.name, entryPath);
            files.push(fileInfo);
        }
        console.log("[Worker] Found", files.length, "files in directory");
    }
    catch (error) {
        console.error("[Worker] Error listing files in", dirPath, ":", error);
    }
    return files;
}
async function detectChanges(path) {
    console.log("[Worker] Detecting changes for path:", path);
    if (!folderHandle)
        return [];
    const newFiles = await listFilesNonRecursively(path);
    const changes = [];
    const newCache = new Map();
    // Check for new or modified files
    for (const file of newFiles) {
        const cached = fileCache.get(file.path);
        newCache.set(file.path, file);
        if (!cached ||
            cached.lastModified.getTime() !== file.lastModified.getTime() ||
            cached.size !== file.size) {
            console.log("[Worker] Change detected for file:", file.path);
            changes.push(file);
        }
    }
    // Check for deleted files
    for (const [path, file] of fileCache) {
        if (!newCache.has(path)) {
            console.log("[Worker] File deleted:", path);
            // Create a new FileInfo object without the deleted property
            const { name, path: filePath, isDirectory, size, lastModified } = file;
            changes.push({
                name,
                path: filePath,
                isDirectory,
                size,
                lastModified,
            });
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
self.onmessage = async ({ data }) => {
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
            }
            catch (error) {
                console.error("[Worker] Error listing files:", error);
                self.postMessage({
                    type: "error",
                    error: error instanceof Error ? error.message : "Failed to list files",
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
                }
                catch (error) {
                    console.error("[Worker] Error watching changes:", error);
                }
            }, pollInterval);
            // Store interval ID for cleanup
            const cleanupMessageId = `cleanup_${data.messageId}`;
            self.onmessage = ({ data: stopData }) => {
                if (stopData.type === "stopWatching" &&
                    stopData.messageId === cleanupMessageId) {
                    console.log("[Worker] Stopping file watch");
                    clearInterval(watchInterval);
                }
            };
            break;
        }
        case "createFile": {
            if (!folderHandle || !data.messageId || !data.path || !data.fileName) {
                console.error("[Worker] Cannot create file - missing parameters");
                self.postMessage({
                    type: "error",
                    error: "Missing parameters for file creation",
                    messageId: data.messageId,
                });
                break;
            }
            try {
                console.log("[Worker] Creating file:", data.fileName, "in", data.path);
                const dirHandle = await getDirHandleFromPath(data.path);
                // Create the file with empty content
                const fileHandle = await dirHandle.getFileHandle(data.fileName, {
                    create: true,
                });
                const writable = await fileHandle.createWritable();
                await writable.write(new Blob([""]));
                await writable.close();
                // Get file info to return
                const filePath = `${data.path}/${data.fileName}`;
                const file = await fileHandle.getFile();
                const fileInfo = {
                    name: data.fileName,
                    path: filePath,
                    isDirectory: false,
                    size: 0,
                    lastModified: new Date(file.lastModified),
                };
                self.postMessage({
                    type: "fileCreated",
                    file: fileInfo,
                    messageId: data.messageId,
                });
            }
            catch (error) {
                console.error("[Worker] Error creating file:", error);
                self.postMessage({
                    type: "error",
                    error: error instanceof Error ? error.message : "Failed to create file",
                    messageId: data.messageId,
                });
            }
            break;
        }
        case "createFolder": {
            if (!folderHandle || !data.messageId || !data.path || !data.fileName) {
                console.error("[Worker] Cannot create folder - missing parameters");
                self.postMessage({
                    type: "error",
                    error: "Missing parameters for folder creation",
                    messageId: data.messageId,
                });
                break;
            }
            try {
                console.log("[Worker] Creating folder:", data.fileName, "in", data.path);
                const dirHandle = await getDirHandleFromPath(data.path);
                // Create the directory
                const newDirHandle = await dirHandle.getDirectoryHandle(data.fileName, {
                    create: true,
                });
                // Get directory info to return
                const dirPath = `${data.path}/${data.fileName}`;
                const dirInfo = {
                    name: data.fileName,
                    path: dirPath,
                    isDirectory: true,
                    size: 0,
                    lastModified: new Date(),
                };
                self.postMessage({
                    type: "folderCreated",
                    folder: dirInfo,
                    messageId: data.messageId,
                });
            }
            catch (error) {
                console.error("[Worker] Error creating folder:", error);
                self.postMessage({
                    type: "error",
                    error: error instanceof Error ? error.message : "Failed to create folder",
                    messageId: data.messageId,
                });
            }
            break;
        }
        case "deleteFile": {
            if (!folderHandle || !data.messageId || !data.path) {
                console.error("[Worker] Cannot delete file - missing parameters");
                self.postMessage({
                    type: "error",
                    error: "Missing parameters for file deletion",
                    messageId: data.messageId,
                });
                break;
            }
            try {
                console.log("[Worker] Deleting file:", data.path);
                // Get parent directory and filename
                const pathParts = data.path.split("/");
                const fileName = pathParts.pop() || "";
                const parentPath = pathParts.join("/");
                const parentDir = await getDirHandleFromPath(parentPath);
                // Try to remove as file first
                try {
                    await parentDir.removeEntry(fileName);
                    self.postMessage({
                        type: "fileDeleted",
                        path: data.path,
                        messageId: data.messageId,
                    });
                }
                catch (error) {
                    // Could be a directory, or might have failed for other reasons
                    if (error instanceof DOMException &&
                        error.name === "TypeMismatchError") {
                        // It's likely a directory, try to remove it
                        try {
                            await parentDir.removeEntry(fileName, { recursive: true });
                            self.postMessage({
                                type: "fileDeleted",
                                path: data.path,
                                messageId: data.messageId,
                            });
                        }
                        catch (dirError) {
                            // Directory removal failed
                            console.error("[Worker] Error removing directory:", dirError);
                            throw dirError;
                        }
                    }
                    else {
                        // Other error
                        throw error;
                    }
                }
            }
            catch (error) {
                console.error("[Worker] Error deleting file/folder:", error);
                self.postMessage({
                    type: "error",
                    error: error instanceof Error
                        ? error.message
                        : "Failed to delete file/folder",
                    messageId: data.messageId,
                });
            }
            break;
        }
    }
};
export {};
