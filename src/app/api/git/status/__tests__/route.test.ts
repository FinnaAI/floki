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

// Mock fs promises
vi.mock("fs/promises", async () => {
	const actual = await vi.importActual<typeof fs>("fs/promises");
	return {
		...actual,
		stat: vi.fn().mockImplementation(() =>
			Promise.resolve({
				isDirectory: () => true,
			} as Stats),
		),
	};
});

describe("Git Status API", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.cwd = vi.fn().mockReturnValue("/test/root");
	});

	it("should return git status for a valid repository", async () => {
		// Mock fs.stat to simulate finding .git directory
		vi.spyOn(fs, "stat").mockResolvedValue({
			isDirectory: () => true,
		} as Stats);

		// Mock git status output
		vi.mocked(execSync).mockReturnValue(
			Buffer.from(
				` M modified.txt\nA  added.txt\n?? untracked.txt\n D deleted.txt`,
				"utf-8",
			),
		);

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/status",
			nextUrl: {
				searchParams: new URLSearchParams({ path: "/test/repo" }),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			modified: ["modified.txt"],
			added: ["added.txt"],
			untracked: ["untracked.txt"],
			deleted: ["deleted.txt"],
		});
	});

	it("should handle non-git repository", async () => {
		// Mock fs.stat to simulate no .git directory found
		vi.spyOn(fs, "stat").mockRejectedValue(new Error("ENOENT"));

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/status",
			nextUrl: {
				searchParams: new URLSearchParams({ path: "/not/a/repo" }),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			modified: [],
			added: [],
			untracked: [],
			deleted: [],
			error: "Not a git repository",
		});
	});

	it("should handle missing path parameter", async () => {
		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/status",
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
		vi.mocked(fs.stat).mockImplementation(() =>
			Promise.resolve({
				isDirectory: () => true,
			} as Stats),
		);

		// Mock git command error
		vi.mocked(execSync).mockImplementation(() => {
			throw new Error("Git command failed");
		});

		const { req } = createMocks<NextRequest>({
			method: "GET",
			url: "http://localhost:3000/api/git/status",
			nextUrl: {
				searchParams: new URLSearchParams({ path: "/test/repo" }),
			},
		});

		const response = await GET(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data).toEqual({
			modified: [],
			added: [],
			untracked: [],
			deleted: [],
			error: "Git command failed",
		});
	});
});
