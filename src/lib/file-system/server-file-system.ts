import type {
	FileInfo,
	FileSystem,
	FileSystemOptions,
} from "@/interfaces/FileSystem/FileSystem";

export class ServerFileSystem implements FileSystem {
	private basePath: string;
	private options: FileSystemOptions;

	constructor(options: FileSystemOptions = {}) {
		this.basePath = options.basePath || process.cwd();
		this.options = options;
	}

	async listFiles(path: string, recursive = false): Promise<FileInfo[]> {
		const response = await fetch(
			`/api/filesystem?path=${encodeURIComponent(path)}&recursive=${recursive}`,
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to list files");
		}

		const data = await response.json();
		return data.files;
	}

	async readFile(path: string): Promise<{ content: string; info: FileInfo }> {
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

	async writeFile(path: string, content: string): Promise<FileInfo> {
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

	watchChanges(
		path: string,
		callback: (changes: FileInfo[]) => void,
	): () => void {
		// Server-side file watching is not implemented in this version
		// You could implement it using WebSocket or Server-Sent Events
		console.warn("File watching is not supported in server mode");
		return () => {};
	}
}
