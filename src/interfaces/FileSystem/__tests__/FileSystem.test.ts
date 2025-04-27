import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	ElectronFileSystem,
	FileInfo,
	WebFileSystem,
} from "../FileSystem";
import { isElectronFileSystem, isWebFileSystem } from "../FileSystem";

// Mock implementations
const createMockWebFS = (): WebFileSystem => ({
	folderHandle: null,
	openFolder: vi.fn(),
	listFiles: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	deleteFile: vi.fn(),
	createDirectory: vi.fn(),
	deleteDirectory: vi.fn(),
	moveFile: vi.fn(),
	copyFile: vi.fn(),
	exists: vi.fn(),
	isDirectory: vi.fn(),
	getFileInfo: vi.fn(),
	watchChanges: vi.fn(),
});

const createMockElectronFS = (): ElectronFileSystem => ({
	setPath: vi.fn(),
	openFolder: vi.fn(),
	listFiles: vi.fn(),
	readFile: vi.fn(),
	writeFile: vi.fn(),
	deleteFile: vi.fn(),
	createDirectory: vi.fn(),
	deleteDirectory: vi.fn(),
	moveFile: vi.fn(),
	copyFile: vi.fn(),
	exists: vi.fn(),
	isDirectory: vi.fn(),
	getFileInfo: vi.fn(),
	watchChanges: vi.fn(),
});

describe("FileSystem Interface", () => {
	describe("Web FileSystem", () => {
		let fs: WebFileSystem;
		const mockFileInfo: FileInfo = {
			name: "test.ts",
			path: "/test.ts",
			isDirectory: false,
			size: 100,
			lastModified: new Date(),
		};

		beforeEach(() => {
			fs = createMockWebFS();
		});

		it("should handle file operations", async () => {
			// Mock implementations
			fs.readFile = vi.fn().mockResolvedValue({
				content: "test content",
				info: mockFileInfo,
			});
			fs.writeFile = vi.fn().mockResolvedValue(undefined);
			fs.exists = vi.fn().mockResolvedValue(true);

			// Test file operations
			await fs.writeFile("/test.ts", "test content");
			const file = await fs.readFile("/test.ts");
			const exists = await fs.exists("/test.ts");

			expect(file.content).toBe("test content");
			expect(file.info).toEqual(mockFileInfo);
			expect(exists).toBe(true);
		});

		it("should handle directory operations", async () => {
			// Mock implementations
			fs.listFiles = vi.fn().mockResolvedValue([mockFileInfo]);
			fs.isDirectory = vi.fn().mockResolvedValue(true);
			fs.createDirectory = vi.fn().mockResolvedValue(undefined);

			// Test directory operations
			await fs.createDirectory("/test");
			const files = await fs.listFiles("/test");
			const isDir = await fs.isDirectory("/test");

			expect(files).toEqual([mockFileInfo]);
			expect(isDir).toBe(true);
		});

		it("should handle folder selection", async () => {
			const mockHandle = { kind: "directory" } as FileSystemDirectoryHandle;
			fs.openFolder = vi.fn().mockResolvedValue(mockHandle);

			const handle = await fs.openFolder();
			expect(handle).toBe(mockHandle);
		});
	});

	describe("Electron FileSystem", () => {
		let fs: ElectronFileSystem;
		const mockFileInfo: FileInfo = {
			name: "test.ts",
			path: "/test.ts",
			isDirectory: false,
			size: 100,
			lastModified: new Date(),
		};

		beforeEach(() => {
			fs = createMockElectronFS();
		});

		it("should handle file operations", async () => {
			fs.readFile = vi.fn().mockResolvedValue({
				content: "test content",
				info: mockFileInfo,
			});
			fs.writeFile = vi.fn().mockResolvedValue(undefined);
			fs.exists = vi.fn().mockResolvedValue(true);

			await fs.writeFile("/test.ts", "test content");
			const file = await fs.readFile("/test.ts");
			const exists = await fs.exists("/test.ts");

			expect(file.content).toBe("test content");
			expect(file.info).toEqual(mockFileInfo);
			expect(exists).toBe(true);
		});

		it("should handle directory operations", async () => {
			fs.listFiles = vi.fn().mockResolvedValue([mockFileInfo]);
			fs.isDirectory = vi.fn().mockResolvedValue(true);
			fs.createDirectory = vi.fn().mockResolvedValue(undefined);

			await fs.createDirectory("/test");
			const files = await fs.listFiles("/test");
			const isDir = await fs.isDirectory("/test");

			expect(files).toEqual([mockFileInfo]);
			expect(isDir).toBe(true);
		});

		it("should handle path setting", async () => {
			fs.setPath = vi.fn();
			fs.openFolder = vi.fn().mockResolvedValue("/selected/path");

			fs.setPath("/test/path");
			const selectedPath = await fs.openFolder();

			expect(fs.setPath).toHaveBeenCalledWith("/test/path");
			expect(selectedPath).toBe("/selected/path");
		});
	});

	describe("Type Guards", () => {
		it("should correctly identify WebFileSystem", () => {
			const webFS = createMockWebFS();
			const electronFS = createMockElectronFS();

			expect(isWebFileSystem(webFS)).toBe(true);
			expect(isWebFileSystem(electronFS)).toBe(false);
		});

		it("should correctly identify ElectronFileSystem", () => {
			const webFS = createMockWebFS();
			const electronFS = createMockElectronFS();

			expect(isElectronFileSystem(electronFS)).toBe(true);
			expect(isElectronFileSystem(webFS)).toBe(false);
		});
	});
});
