import { promises as fs, type Stats } from "fs";
import { execSync } from "node:child_process";
import type { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../route";

// Mock child_process
vi.mock("node:child_process", () => ({
	execSync: vi.fn(),
	__esModule: true,
	default: {},
}));

describe("Git Diff API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.cwd = vi.fn().mockReturnValue("/test/root");
	});

	it("should return git diff for a valid file", async () => {
		// Mock fs.stat to simulate finding .git directory
		vi.spyOn(fs, "stat").mockResolvedValue({
			isDirectory: () => true,
		} as Stats);

		// Mock git show command for old content
		vi.mocked(execSync)
			.mockReturnValueOnce("old file content") // git show
			.mockReturnValueOnce(
				`@@ -1,3 +1,3 @@\n-old line\n+new line\n unchanged line`,
			); // git diff

		// Mock current file content
		vi.spyOn(fs, "readFile").mockResolvedValue("new file content");

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/diff",
			nextUrl: {
				searchParams: new URLSearchParams({
					path: "/test/repo/file.txt",
					rootPath: "/test/repo",
				}),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			oldContent: "old file content",
			newContent: "new file content",
			hunks: [
				{
					oldStart: 1,
					oldLines: 3,
					newStart: 1,
					newLines: 3,
					lines: ["-old line", "+new line", " unchanged line"],
				},
			],
		});
	});

	it("should handle non-git repository", async () => {
		// Mock fs.stat to simulate no .git directory found
		vi.spyOn(fs, "stat").mockRejectedValue(new Error("ENOENT"));

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/diff",
			nextUrl: {
				searchParams: new URLSearchParams({
					path: "/not/a/repo/file.txt",
				}),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			oldContent: "",
			newContent: "",
			hunks: [],
			error: "Not a git repository",
		});
	});

	it("should handle missing path parameter", async () => {
		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/diff",
			nextUrl: {
				searchParams: new URLSearchParams({}),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data).toEqual({
			error: "Path parameter is required",
		});
	});

	it("should handle git command errors", async () => {
		// Mock fs.stat to simulate finding .git directory
		vi.spyOn(fs, "stat").mockResolvedValue({
			isDirectory: () => true,
		} as Stats);

		// Mock git command error
		vi.mocked(execSync).mockImplementation(() => {
			throw new Error("Git command failed");
		});

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/diff",
			nextUrl: {
				searchParams: new URLSearchParams({
					path: "/test/repo/file.txt",
				}),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			oldContent: "",
			newContent: "",
			hunks: [],
			error: "Git command failed",
		});
	});

	it("should handle provided current content", async () => {
		// Mock fs.stat to simulate finding .git directory
		vi.spyOn(fs, "stat").mockResolvedValue({
			isDirectory: () => true,
		} as Stats);

		// Mock git show command for old content
		vi.mocked(execSync)
			.mockReturnValueOnce("old file content") // git show
			.mockReturnValueOnce(
				`@@ -1,1 +1,1 @@
-old content
+new content`,
			); // git diff

		const currentContent = "provided current content";

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/diff",
			nextUrl: {
				searchParams: new URLSearchParams({
					path: "/test/repo/file.txt",
					currentContent,
				}),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			oldContent: "old file content",
			newContent: currentContent,
			hunks: [
				{
					oldStart: 1,
					oldLines: 1,
					newStart: 1,
					newLines: 1,
					lines: ["-old content", "+new content"],
				},
			],
		});
	});
});
