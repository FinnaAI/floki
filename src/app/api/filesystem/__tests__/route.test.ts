import * as fs from "node:fs";
import type * as util from "node:util";
import type { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../route";

// Mock util.promisify to return the mocked fs.promises functions
vi.mock("node:util", async () => {
	const actual = await vi.importActual<typeof util>("node:util");
	return {
		...actual,
		promisify: vi.fn((fn) => {
			if (fn === fs.readdir) return fs.promises.readdir;
			if (fn === fs.stat) return fs.promises.stat;
			if (fn === fs.readFile) return fs.promises.readFile;
			if (fn === fs.writeFile) return fs.promises.writeFile;
			return actual.promisify(fn);
		}),
	};
});

// Mock filesystem modules
vi.mock("node:fs", async () => {
	const actual = await vi.importActual<typeof fs>("node:fs");
	const mockStats = {
		isDirectory: () => true,
		size: 0,
		mtime: new Date(),
	} as fs.Stats;

	return {
		...actual,
		readdir: vi.fn((path, callback) => {
			callback(null, ["file1.txt", "file2.txt"]);
		}),
		stat: vi.fn(
			(
				path,
				callback: (err: NodeJS.ErrnoException | null, stats: fs.Stats) => void,
			) => {
				callback(null, mockStats);
			},
		),
		readFile: vi.fn(),
		writeFile: vi.fn(),
		existsSync: vi.fn(),
		promises: {
			readdir: vi.fn().mockResolvedValue(["file1.txt", "file2.txt"]),
			stat: vi.fn().mockResolvedValue(mockStats),
			readFile: vi.fn(),
			writeFile: vi.fn(),
		},
	};
});

interface MockStats {
	isDirectory: () => boolean;
	size: number;
	mtime: Date;
}

describe("Filesystem API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.cwd = vi.fn().mockReturnValue("/test/root");
	});

	it("should list files", async () => {
		// Mock filesystem operations
		vi.mocked(fs.existsSync).mockReturnValue(true);

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/filesystem",
			nextUrl: {
				searchParams: new URLSearchParams({ path: "/" }),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty("files");
		expect(Array.isArray(data.files)).toBe(true);
		expect(data.files).toHaveLength(3); // Two mock files + parent directory
		expect(data.files[0]).toMatchObject({ name: "..", isDirectory: true }); // Parent directory
		expect(data.files[1]).toMatchObject({ name: "file1.txt" }); // First file
		expect(data.files[2]).toMatchObject({ name: "file2.txt" }); // Second file
	}, 10000);

	it("should handle file operations", async () => {
		const mockContent = "test content";
		const mockStats: MockStats = {
			isDirectory: () => false,
			size: mockContent.length,
			mtime: new Date(),
		};

		// Mock filesystem operations
		vi.mocked(fs.promises.stat).mockResolvedValue(mockStats as fs.Stats);
		vi.mocked(fs.promises.readFile).mockResolvedValue(mockContent);
		vi.mocked(fs.existsSync).mockReturnValue(true);

		const { req } = createMocks<NextRequest>({
			method: "POST",
			url: "http://localhost:3000/api/filesystem",
			json: () =>
				Promise.resolve({
					filePath: "./test.txt",
				}),
		});

		const response = await POST(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toHaveProperty("content", mockContent);
	}, 10000);

	it("should handle errors", async () => {
		// Mock filesystem operation to fail
		vi.mocked(fs.promises.stat).mockRejectedValue(new Error("File not found"));

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/filesystem",
			nextUrl: {
				searchParams: new URLSearchParams({ path: "/invalid/path" }),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data).toHaveProperty("error");
	}, 10000);
});
