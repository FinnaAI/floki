import path from "path";
import type { FileInfo } from "@/interfaces/FileSystem/FileSystem";
import type { FSWatcher } from "chokidar";
import chokidar from "chokidar";
import { ipcMain } from "electron";
import fs from "fs/promises";

// Map to store active watchers
const watchers = new Map<string, FSWatcher>();

// Helper to get file info
async function getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    return {
        name: path.basename(filePath),
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        lastModified: new Date(stats.mtime),
    };
}

// Set up IPC handlers
export function setupFileSystem() {
    // List files in directory
    ipcMain.handle("fs-list-files", async (_event, { path: dirPath, recursive }) => {
        try {
            const files: FileInfo[] = [];
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const info = await getFileInfo(fullPath);
                files.push(info);

                if (recursive && entry.isDirectory()) {
                    const subFiles = await listFilesRecursive(fullPath);
                    files.push(...subFiles);
                }
            }

            return files;
        } catch (error) {
            console.error("Error listing files:", error);
            throw error;
        }
    });

    // Helper function for recursive file listing
    async function listFilesRecursive(dirPath: string): Promise<FileInfo[]> {
        const files: FileInfo[] = [];
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const info = await getFileInfo(fullPath);
            files.push(info);

            if (entry.isDirectory()) {
                const subFiles = await listFilesRecursive(fullPath);
                files.push(...subFiles);
            }
        }

        return files;
    }

    // Read file
    ipcMain.handle("fs-read-file", async (_event, { path: filePath }) => {
        try {
            const content = await fs.readFile(filePath, "utf-8");
            const info = await getFileInfo(filePath);
            return { content, info };
        } catch (error) {
            console.error("Error reading file:", error);
            throw error;
        }
    });

    // Write file
    ipcMain.handle("fs-write-file", async (_event, { path: filePath, content }) => {
        try {
            // Ensure the directory exists
            const dirPath = path.dirname(filePath);
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(filePath, content, "utf-8");
            return await getFileInfo(filePath);
        } catch (error) {
            console.error("Error writing file:", error);
            throw error;
        }
    });

    // Delete file
    ipcMain.handle("fs-delete-file", async (_event, { path: filePath }) => {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error("Error deleting file:", error);
            throw error;
        }
    });

    // Create directory
    ipcMain.handle("fs-create-directory", async (_event, { path: dirPath }) => {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return await getFileInfo(dirPath);
        } catch (error) {
            console.error("Error creating directory:", error);
            throw error;
        }
    });

    // Delete directory
    ipcMain.handle("fs-delete-directory", async (_event, { path: dirPath }) => {
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            console.error("Error deleting directory:", error);
            throw error;
        }
    });

    // Move file
    ipcMain.handle("fs-move-file", async (_event, { oldPath, newPath }) => {
        try {
            // Ensure target directory exists
            const targetDir = path.dirname(newPath);
            await fs.mkdir(targetDir, { recursive: true });
            await fs.rename(oldPath, newPath);
            return await getFileInfo(newPath);
        } catch (error) {
            console.error("Error moving file:", error);
            throw error;
        }
    });

    // Copy file
    ipcMain.handle("fs-copy-file", async (_event, { sourcePath, destPath }) => {
        try {
            // Ensure target directory exists
            const targetDir = path.dirname(destPath);
            await fs.mkdir(targetDir, { recursive: true });
            await fs.copyFile(sourcePath, destPath);
            return await getFileInfo(destPath);
        } catch (error) {
            console.error("Error copying file:", error);
            throw error;
        }
    });

    // Check if file exists
    ipcMain.handle("fs-exists", async (_event, { path: filePath }) => {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    });

    // Check if path is directory
    ipcMain.handle("fs-is-directory", async (_event, { path: filePath }) => {
        try {
            const stats = await fs.stat(filePath);
            return stats.isDirectory();
        } catch (error) {
            console.error("Error checking if directory:", error);
            throw error;
        }
    });

    // Get file info
    ipcMain.handle("fs-get-file-info", async (_event, { path: filePath }) => {
        try {
            return await getFileInfo(filePath);
        } catch (error) {
            console.error("Error getting file info:", error);
            throw error;
        }
    });

    // Watch directory for changes
    ipcMain.handle("fs-watch-changes", async (event, { path: watchPath, id }) => {
        try {
            // Clean up existing watcher if any
            if (watchers.has(id)) {
                watchers.get(id)?.close();
                watchers.delete(id);
            }

            // Create new watcher
            const watcher = chokidar.watch(watchPath, {
                ignoreInitial: true,
                awaitWriteFinish: true,
                ignored: /(^|[\/\\])\../, // Ignore dotfiles
                persistent: true
            });

            // Handle all events
            watcher.on("all", async (eventType: string, filePath: string) => {
                try {
                    const info = await getFileInfo(filePath);
                    event.sender.send(id, [info]);
                } catch (error) {
                    console.error("Error handling file change:", error);
                }
            });

            // Store watcher for cleanup
            watchers.set(id, watcher);
        } catch (error) {
            console.error("Error setting up file watcher:", error);
            throw error;
        }
    });

    // Stop watching directory
    ipcMain.handle("fs-unwatch-changes", (_event, { id }) => {
        try {
            if (watchers.has(id)) {
                watchers.get(id)?.close();
                watchers.delete(id);
            }
        } catch (error) {
            console.error("Error stopping file watcher:", error);
            throw error;
        }
    });
} 