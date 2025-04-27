import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface WorkerMessage {
	type: string;
	path?: string;
	content?: string;
}

interface WorkerResponse {
	type: string;
	content?: string;
	files?: unknown[];
	error?: string;
}

// Mock Worker
class WorkerMock {
	onmessage: ((e: MessageEvent<WorkerResponse>) => void) | null = null;
	postMessage(data: WorkerMessage) {
		if (this.onmessage) {
			this.onmessage(new MessageEvent("message", { data }));
		}
	}
}

describe("FileSystem Worker", () => {
	let messages: WorkerResponse[] = [];
	let mockWorker: WorkerMock;

	beforeEach(() => {
		messages = [];
		mockWorker = new WorkerMock();

		// Set up message handling
		mockWorker.onmessage = (e) => {
			messages.push(e.data);
		};
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("File Operations", () => {
		it("should handle read operations", () => {
			mockWorker.postMessage({
				type: "readFile",
				path: "/test.txt",
			});

			expect(messages[0]).toEqual({
				type: "fileContent",
				content: expect.any(String),
			});
		});

		it("should handle write operations", () => {
			mockWorker.postMessage({
				type: "writeFile",
				path: "/test.txt",
				content: "test content",
			});

			expect(messages[0]).toEqual({
				type: "success",
			});
		});

		it("should handle delete operations", () => {
			mockWorker.postMessage({
				type: "deleteFile",
				path: "/test.txt",
			});

			expect(messages[0]).toEqual({
				type: "success",
			});
		});
	});

	describe("Directory Operations", () => {
		it("should handle directory listing", () => {
			mockWorker.postMessage({
				type: "listFiles",
				path: "/",
			});

			expect(messages[0]).toEqual({
				type: "fileList",
				files: expect.any(Array),
			});
		});

		it("should handle directory creation", () => {
			mockWorker.postMessage({
				type: "createDirectory",
				path: "/test-dir",
			});

			expect(messages[0]).toEqual({
				type: "success",
			});
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid operations", () => {
			mockWorker.postMessage({
				type: "invalidOperation",
			});

			expect(messages[0]).toEqual({
				type: "error",
				error: expect.any(String),
			});
		});

		it("should handle file not found", () => {
			mockWorker.postMessage({
				type: "readFile",
				path: "/nonexistent.txt",
			});

			expect(messages[0]).toEqual({
				type: "error",
				error: expect.stringContaining("not found"),
			});
		});
	});
});
