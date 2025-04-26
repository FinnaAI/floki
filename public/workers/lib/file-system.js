import { isElectron } from "./utils";
class WebFileSystem {
    folderHandle = null;
    worker = null;
    constructor() {
        if (typeof window !== "undefined") {
            this.worker = new Worker("/workers/workers/file-system.worker.js", {
                type: "module",
            });
        }
    }
    async openFolder() {
        try {
            const handle = await window.showDirectoryPicker();
            this.folderHandle = handle;
            if (this.worker) {
                this.worker.postMessage({
                    type: "setFolder",
                    handle,
                    messageId: "initial",
                });
            }
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
    worker = null;
    constructor() {
        if (typeof window !== "undefined") {
            this.worker = new Worker("/workers/workers/file-system.worker.js", {
                type: "module",
            });
        }
    }
    setPath(path) {
        this.currentPath = path;
        this.worker?.postMessage({
            type: "setFolder",
            path,
            messageId: "initial",
        });
    }
    async openFolder() {
        if (!window.electron?.openFolder) {
            throw new Error("Electron API not available");
        }
        const result = await window.electron.openFolder();
        if (result.filePaths?.[0]) {
            this.setPath(result.filePaths[0]);
            return result.filePaths[0];
        }
        return null;
    }
    async listFiles(dirPath, recursive = false) {
        return this.sendWorkerMessage("listFiles", {
            path: dirPath,
            recursive,
        });
    }
    async readFile(path) {
        return this.sendWorkerMessage("readFile", { path });
    }
    async writeFile(path, content) {
        return this.sendWorkerMessage("writeFile", { path, content });
    }
    async deleteFile(filePath) {
        return this.sendWorkerMessage("deleteFile", { path: filePath });
    }
    async createDirectory(dirPath) {
        return this.sendWorkerMessage("createDirectory", { path: dirPath });
    }
    async deleteDirectory(dirPath) {
        return this.sendWorkerMessage("deleteDirectory", { path: dirPath });
    }
    async moveFile(oldPath, newPath) {
        return this.sendWorkerMessage("moveFile", { oldPath, newPath });
    }
    async copyFile(sourcePath, destPath) {
        return this.sendWorkerMessage("copyFile", { sourcePath, destPath });
    }
    async exists(path) {
        return this.sendWorkerMessage("exists", { path });
    }
    async isDirectory(path) {
        return this.sendWorkerMessage("isDirectory", { path });
    }
    async getFileInfo(path) {
        return this.sendWorkerMessage("getFileInfo", { path });
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
    sendWorkerMessage(type, data) {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error("Worker not initialized"));
                return;
            }
            const messageId = Math.random().toString(36).substring(7);
            const handler = (event) => {
                const { type: responseType, data: responseData, error, messageId: responseId, } = event.data;
                if (responseId !== messageId)
                    return;
                this.worker?.removeEventListener("message", handler);
                if (responseType === "error") {
                    reject(new Error(error));
                }
                else {
                    resolve(responseData);
                }
            };
            this.worker.addEventListener("message", handler);
            this.worker.postMessage({
                type,
                ...data,
                messageId,
            });
        });
    }
}
export function createFileSystem() {
    if (isElectron()) {
        return new ElectronFileSystem();
    }
    return new WebFileSystem();
}
