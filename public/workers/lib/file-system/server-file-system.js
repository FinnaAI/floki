export class ServerFileSystem {
    basePath;
    options;
    constructor(options = {}) {
        this.basePath = options.basePath || process.cwd();
        this.options = options;
    }
    async listFiles(path, recursive = false) {
        const response = await fetch(`/api/filesystem?path=${encodeURIComponent(path)}&recursive=${recursive}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to list files");
        }
        const data = await response.json();
        return data.files;
    }
    async readFile(path) {
        const response = await fetch("/api/filesystem", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ filePath: path }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to read file");
        }
        const data = await response.json();
        return {
            content: data.content,
            info: {
                name: data.name,
                path: data.path,
                isDirectory: false,
                size: data.size,
                lastModified: new Date(data.lastModified),
            },
        };
    }
    async writeFile(path, content) {
        const response = await fetch("/api/filesystem", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ filePath: path, content }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to write file");
        }
        const data = await response.json();
        return {
            name: data.name,
            path: data.path,
            isDirectory: false,
            size: data.size,
            lastModified: new Date(data.lastModified),
        };
    }
    watchChanges(path, callback) {
        // Server-side file watching is not implemented in this version
        // You could implement it using WebSocket or Server-Sent Events
        console.warn("File watching is not supported in server mode");
        return () => { };
    }
}
