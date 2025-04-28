import { isElectron } from "./utils";
class WebFileSystem {
    folderHandle = null;
    worker = null;
    constructor() {
        if (typeof window !== "undefined") {
            try {
                this.worker = new Worker("/workers/workers/file-system.worker.js", {
                    type: "module",
                });
            }
            catch (e) {
                console.error("Failed to create file system worker:", e);
            }
        }
    }
    async setFolderHandle(handle) {
        this.folderHandle = handle;
        if (this.worker) {
            this.worker.postMessage({
                type: "setFolder",
                handle,
                messageId: "initial",
            });
        }
    }
    async openFolder() {
        try {
            const handle = await window.showDirectoryPicker();
            await this.setFolderHandle(handle);
            return handle;
        }
        catch (error) {
            console.error("Error opening folder:", error);
            throw error;
        }
    }
    async listFiles(dirPath, recursive = false) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error("Worker not initialized"));
                return;
            }
            const messageId = Math.random().toString(36).substring(7);
            const handler = (event) => {
                const { type, files, error, messageId: responseId } = event.data;
                if (responseId !== messageId)
                    return;
                this.worker?.removeEventListener("message", handler);
                if (type === "error") {
                    reject(new Error(error));
                }
                else if (type === "fileList") {
                    resolve(files);
                }
            };
            this.worker.addEventListener("message", handler);
            this.worker.postMessage({
                type: "listFiles",
                path: dirPath,
                recursive,
                messageId,
            });
        });
    }
    async readFile(path) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        // Navigate to the file through the directory structure
        const parts = path.split("/").filter(Boolean);
        let currentHandle = this.folderHandle;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!part)
                continue;
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        const fileName = parts[parts.length - 1];
        if (!fileName) {
            throw new Error("Invalid file path");
        }
        const fileHandle = await currentHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        const info = {
            name: file.name,
            path,
            isDirectory: false,
            size: file.size,
            lastModified: new Date(file.lastModified),
            handle: fileHandle,
        };
        return { content, info };
    }
    async writeFile(path, content) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        // Navigate to the file through the directory structure
        const parts = path.split("/").filter(Boolean);
        let currentHandle = this.folderHandle;
        // Create directories if they don't exist
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!part)
                continue;
            currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
        }
        const fileName = parts[parts.length - 1];
        if (!fileName) {
            throw new Error("Invalid file path");
        }
        const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }
    watchChanges(path, callback) {
        if (!this.worker) {
            throw new Error("Worker not initialized");
        }
        const messageId = Math.random().toString(36).substring(7);
        const handler = (event) => {
            const { type, changes } = event.data;
            if (type === "changes") {
                callback(changes);
            }
        };
        this.worker.addEventListener("message", handler);
        this.worker.postMessage({
            type: "watchChanges",
            path,
            messageId,
        });
        return () => {
            this.worker?.removeEventListener("message", handler);
            this.worker?.postMessage({
                type: "stopWatching",
                messageId: `cleanup_${messageId}`,
            });
        };
    }
    async deleteFile(filePath) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        // Navigate to the parent directory
        const parts = filePath.split("/").filter(Boolean);
        const fileName = parts.pop();
        if (!fileName)
            throw new Error("Invalid file path");
        let currentHandle = this.folderHandle;
        for (const part of parts) {
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        await currentHandle.removeEntry(fileName);
    }
    async createDirectory(dirPath) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        const parts = dirPath.split("/").filter(Boolean);
        let currentHandle = this.folderHandle;
        for (const part of parts) {
            currentHandle = await currentHandle.getDirectoryHandle(part, {
                create: true,
            });
        }
    }
    async deleteDirectory(dirPath) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        // Navigate to the parent directory
        const parts = dirPath.split("/").filter(Boolean);
        const dirName = parts.pop();
        if (!dirName)
            throw new Error("Invalid directory path");
        let currentHandle = this.folderHandle;
        for (const part of parts) {
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }
        await currentHandle.removeEntry(dirName, { recursive: true });
    }
    async moveFile(oldPath, newPath) {
        // Copy the file to new location and delete the old one
        await this.copyFile(oldPath, newPath);
        await this.deleteFile(oldPath);
    }
    async copyFile(sourcePath, destPath) {
        const { content } = await this.readFile(sourcePath);
        await this.writeFile(destPath, content);
    }
    async exists(path) {
        try {
            await this.getFileInfo(path);
            return true;
        }
        catch {
            return false;
        }
    }
    async isDirectory(path) {
        try {
            const info = await this.getFileInfo(path);
            return info.isDirectory;
        }
        catch {
            return false;
        }
    }
    async getFileInfo(path) {
        if (!this.folderHandle) {
            throw new Error("No folder selected");
        }
        const parts = path.split("/").filter(Boolean);
        let currentHandle = this.folderHandle;
        const name = parts.length > 0 && parts[parts.length - 1]
            ? parts[parts.length - 1]
            : this.folderHandle.name;
        try {
            // Navigate through directories
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!part)
                    continue;
                currentHandle = await currentHandle.getDirectoryHandle(part);
            }
            // Handle the last part if it exists
            if (parts.length > 0) {
                const lastPart = parts[parts.length - 1];
                if (!lastPart)
                    throw new Error("Invalid path");
                try {
                    currentHandle = await currentHandle.getFileHandle(lastPart);
                }
                catch {
                    currentHandle = await currentHandle.getDirectoryHandle(lastPart);
                }
            }
            if (currentHandle.kind === "file") {
                const file = await currentHandle.getFile();
                return {
                    name: name || "",
                    path,
                    isDirectory: false,
                    size: file.size,
                    lastModified: new Date(file.lastModified),
                    handle: currentHandle,
                };
            }
            return {
                name: name || "",
                path,
                isDirectory: true,
                size: 0,
                lastModified: new Date(),
                handle: currentHandle,
            };
        }
        catch (error) {
            throw new Error(`File or directory not found: ${path}`);
        }
    }
}
class ElectronFileSystem {
    currentPath = null;
    constructor() {
        // No worker needed for Electron - we'll use IPC directly
        console.log("ElectronFileSystem initialized");
    }
    setPath(path) {
        this.currentPath = path;
        console.log("Set current path to:", path);
    }
    async openFolder() {
        if (!window.electron?.openFolder) {
            throw new Error("Electron API not available");
        }
        try {
            const result = await window.electron.openFolder();
            if (result.filePaths?.[0]) {
                this.setPath(result.filePaths[0]);
                return result.filePaths[0];
            }
            return null;
        }
        catch (err) {
            console.error("Error opening folder:", err);
            throw err;
        }
    }
    async listFiles(dirPath, recursive = false) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(dirPath);
            console.log("Listing files in path:", fullPath);
            const files = await window.electron.fileSystem.listFiles(fullPath, recursive);
            return files;
        }
        catch (err) {
            console.error("Error listing files:", err);
            throw err;
        }
    }
    async readFile(path) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(path);
            const result = await window.electron.fileSystem.readFile(fullPath);
            return result;
        }
        catch (err) {
            console.error("Error reading file:", err);
            throw err;
        }
    }
    async writeFile(path, content) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(path);
            await window.electron.fileSystem.writeFile(fullPath, content);
        }
        catch (err) {
            console.error("Error writing file:", err);
            throw err;
        }
    }
    async deleteFile(path) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(path);
            await window.electron.fileSystem.deleteFile(fullPath);
        }
        catch (err) {
            console.error("Error deleting file:", err);
            throw err;
        }
    }
    async createDirectory(dirPath) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(dirPath);
            await window.electron.fileSystem.createDirectory(fullPath);
        }
        catch (err) {
            console.error("Error creating directory:", err);
            throw err;
        }
    }
    async deleteDirectory(dirPath) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(dirPath);
            await window.electron.fileSystem.deleteDirectory(fullPath);
        }
        catch (err) {
            console.error("Error deleting directory:", err);
            throw err;
        }
    }
    async moveFile(oldPath, newPath) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullOldPath = this.getFullPath(oldPath);
            const fullNewPath = this.getFullPath(newPath);
            await window.electron.fileSystem.moveFile(fullOldPath, fullNewPath);
        }
        catch (err) {
            console.error("Error moving file:", err);
            throw err;
        }
    }
    async copyFile(sourcePath, destPath) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullSourcePath = this.getFullPath(sourcePath);
            const fullDestPath = this.getFullPath(destPath);
            await window.electron.fileSystem.copyFile(fullSourcePath, fullDestPath);
        }
        catch (err) {
            console.error("Error copying file:", err);
            throw err;
        }
    }
    async exists(path) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(path);
            return await window.electron.fileSystem.exists(fullPath);
        }
        catch (err) {
            console.error("Error checking if file exists:", err);
            throw err;
        }
    }
    async isDirectory(path) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(path);
            return await window.electron.fileSystem.isDirectory(fullPath);
        }
        catch (err) {
            console.error("Error checking if path is directory:", err);
            throw err;
        }
    }
    async getFileInfo(path) {
        try {
            if (!window.electron?.fileSystem) {
                throw new Error("Electron API not available");
            }
            const fullPath = this.getFullPath(path);
            return await window.electron.fileSystem.getFileInfo(fullPath);
        }
        catch (err) {
            console.error("Error getting file info:", err);
            throw err;
        }
    }
    watchChanges(path, callback) {
        if (!window.electron?.fileSystem) {
            throw new Error("Electron API not available");
        }
        const fullPath = this.getFullPath(path);
        const unwatchFn = window.electron.fileSystem.watchChanges(fullPath, callback);
        return unwatchFn;
    }
    // Helper for path resolution
    getFullPath(relativePath) {
        if (!this.currentPath) {
            throw new Error("No current path set");
        }
        if (!relativePath)
            return this.currentPath;
        // If relativePath is already absolute (starts with / on Unix or C:\ on Windows)
        if (relativePath.startsWith("/") || /^[A-Z]:\\/.test(relativePath)) {
            return relativePath;
        }
        // Combine paths
        return `${this.currentPath}/${relativePath}`;
    }
}
export function createFileSystem() {
    if (isElectron()) {
        console.log("Creating Electron file system");
        return new ElectronFileSystem();
    }
    console.log("Creating Web file system");
    return new WebFileSystem();
}
