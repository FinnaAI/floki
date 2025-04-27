import type { ChildProcess } from "node:child_process";
import WS from "jest-websocket-mock";
import { createMocks } from "node-mocks-http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "../route";

type ExecCallback = (
	error: Error | null,
	result: { stdout: string; stderr: string },
) => void;

type ExecFn = (cmd: string, cb: ExecCallback) => void;

// Mock node:util
vi.mock("node:util", () => {
	const mock = {
		promisify: vi.fn(
			(fn: ExecFn) => (cmd: string) =>
				new Promise((resolve, reject) => {
					fn(
						cmd,
						(
							error: Error | null,
							result: { stdout: string; stderr: string },
						) => {
							if (error) reject(error);
							else resolve(result);
						},
					);
				}),
		),
	};
	return {
		...mock,
		default: mock,
		__esModule: true,
	};
});

// Mock child_process
vi.mock("node:child_process", () => {
	const mockExec = vi.fn((cmd: string, callback: ExecCallback) => {
		if (typeof callback === "function") {
			callback(null, { stdout: "test output", stderr: "" });
		}
		return undefined;
	});

	return {
		exec: mockExec,
		spawn: vi.fn(() => ({
			stdout: {
				on: vi.fn(),
			},
			stderr: {
				on: vi.fn(),
			},
			stdin: {
				write: vi.fn(),
			},
			on: vi.fn(),
			kill: vi.fn(),
		})),
		__esModule: true,
		default: {},
	};
});

// Mock WebSocket server
vi.mock("ws", () => ({
	WebSocketServer: vi.fn(() => ({
		on: vi.fn(),
	})),
	__esModule: true,
	default: {},
}));

describe("Commands API Route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetModules();
	});

	describe("POST /api/commands", () => {
		it("executes non-interactive command successfully", async () => {
			const { req } = createMocks({
				method: "POST",
				body: {
					command: 'echo "test"',
				},
				json: () => ({ command: 'echo "test"' }),
			});

			const mockExec = vi.spyOn(require("node:child_process"), "exec");
			mockExec.mockImplementation((cmd: unknown, cb: unknown) => {
				(cb as ExecCallback)(null, { stdout: "test output", stderr: "" });
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({ output: "test output" });
			expect(mockExec).toHaveBeenCalledWith(
				'echo "test"',
				expect.any(Function),
			);
		});

		it("handles command execution errors", async () => {
			const { req } = createMocks({
				method: "POST",
				body: {
					command: "invalid-command",
				},
				json: () => ({ command: "invalid-command" }),
			});

			const mockExec = vi.spyOn(require("node:child_process"), "exec");
			mockExec.mockImplementation((cmd: unknown, cb: unknown) => {
				(cb as ExecCallback)(new Error("Command not found"), {
					stdout: "",
					stderr: "Command not found",
				});
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data).toEqual({
				error: "Command execution failed",
				details: "Command not found",
			});
		});

		it("validates command input", async () => {
			const { req } = createMocks({
				method: "POST",
				body: {},
				json: () => ({}),
			});

			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data).toEqual({
				error: "Command is required and must be a string",
			});
		});
	});

	describe("GET /api/commands", () => {
		it("returns allowed commands and websocket info", async () => {
			const response = await GET();
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data).toEqual({
				allowedCommands: ["ls", "pwd", "echo", "date", "codex", "claude"],
				wsPort: expect.any(Number),
				info: "Connect to WebSocket on the specified port for interactive commands",
			});
		});
	});

	describe("WebSocket Server", () => {
		let mockWsServer: WS;
		let mockSpawn: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			mockWsServer = new WS("ws://localhost:4000");
			mockSpawn = vi.spyOn(require("node:child_process"), "spawn");
		});

		afterEach(() => {
			WS.clean();
		});

		it("handles start command message", async () => {
			const mockProc = {
				stdout: { on: vi.fn() },
				stderr: { on: vi.fn() },
				on: vi.fn(),
			};

			mockSpawn.mockReturnValue(mockProc as unknown as ChildProcess);

			await mockWsServer.connected;
			mockWsServer.send(
				JSON.stringify({
					type: "start",
					command: "ls",
				}),
			);

			expect(mockSpawn).toHaveBeenCalledWith("ls", [], expect.any(Object));
		});

		it("handles codex command specially", async () => {
			const mockProc = {
				stdout: { on: vi.fn() },
				stderr: { on: vi.fn() },
				on: vi.fn(),
			};

			mockSpawn.mockReturnValue(mockProc as unknown as ChildProcess);

			await mockWsServer.connected;
			mockWsServer.send(
				JSON.stringify({
					type: "start",
					command: "codex test query",
					command_type: "codex",
				}),
			);

			expect(mockSpawn).toHaveBeenCalledWith(
				"codex",
				["--approval-mode", "full-auto", "-q", "test query"],
				expect.any(Object),
			);
		});

		it("handles stop command message", async () => {
			const mockProc = {
				stdout: { on: vi.fn() },
				stderr: { on: vi.fn() },
				on: vi.fn(),
				kill: vi.fn(),
			};

			mockSpawn.mockReturnValue(mockProc as unknown as ChildProcess);

			await mockWsServer.connected;
			mockWsServer.send(
				JSON.stringify({
					type: "start",
					command: "ls",
				}),
			);

			mockWsServer.send(
				JSON.stringify({
					type: "stop",
				}),
			);

			expect(mockProc.kill).toHaveBeenCalledWith("SIGTERM");
		});

		it("handles input message for active process", async () => {
			const mockProc = {
				stdout: { on: vi.fn() },
				stderr: { on: vi.fn() },
				stdin: { write: vi.fn() },
				on: vi.fn(),
			};

			mockSpawn.mockReturnValue(mockProc as unknown as ChildProcess);

			await mockWsServer.connected;
			mockWsServer.send(
				JSON.stringify({
					type: "start",
					command: "interactive-command",
				}),
			);

			mockWsServer.send(
				JSON.stringify({
					type: "input",
					input: "test input",
				}),
			);

			expect(mockProc.stdin.write).toHaveBeenCalledWith("test input\n");
		});

		it("handles internal commands", async () => {
			const mockProc = {
				stdout: { on: vi.fn() },
				stderr: { on: vi.fn() },
				on: vi.fn(),
			};

			mockSpawn.mockReturnValue(mockProc as unknown as ChildProcess);

			await mockWsServer.connected;
			mockWsServer.send(
				JSON.stringify({
					type: "start",
					command: "internal-command",
					internal: true,
				}),
			);

			expect(mockSpawn).toHaveBeenCalledWith(
				"internal-command",
				[],
				expect.any(Object),
			);
		});

		it("handles connection close", async () => {
			const mockProc = {
				stdout: { on: vi.fn() },
				stderr: { on: vi.fn() },
				on: vi.fn(),
				kill: vi.fn(),
			};

			mockSpawn.mockReturnValue(mockProc as unknown as ChildProcess);

			await mockWsServer.connected;
			mockWsServer.send(
				JSON.stringify({
					type: "start",
					command: "ls",
				}),
			);

			mockWsServer.close();

			expect(mockProc.kill).toHaveBeenCalled();
		});
	});
});
