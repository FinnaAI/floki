import { act, renderHook } from "@testing-library/react";
import WS from "jest-websocket-mock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useWebSocket } from "../useWebSocket";

describe("useWebSocket", () => {
	let server: WS;

	beforeEach(() => {
		// Mock fetch for port discovery
		global.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve({ wsPort: 4000 }),
		});

		server = new WS("ws://localhost:4000");
	});

	afterEach(() => {
		WS.clean();
		vi.restoreAllMocks();
	});

	it("should connect to websocket", async () => {
		const { result } = renderHook(() => useWebSocket());

		await server.connected;
		expect(result.current.connected).toBe(true);
	});

	it("should send and receive messages", async () => {
		const { result } = renderHook(() => useWebSocket());
		await server.connected;

		act(() => {
			result.current.sendCommand("test command");
		});

		await expect(server).toReceiveMessage(
			JSON.stringify({
				type: "start",
				command: "test command",
				internal: false,
			}),
		);

		server.send(
			JSON.stringify({
				type: "output",
				data: "command output",
			}),
		);

		expect(result.current.messages).toContainEqual(
			expect.objectContaining({
				type: "system",
				content: "command output",
			}),
		);
	});

	it("should handle codex commands", async () => {
		const { result } = renderHook(() => useWebSocket());
		await server.connected;

		act(() => {
			result.current.sendCommand("codex test query");
		});

		await expect(server).toReceiveMessage(
			JSON.stringify({
				type: "start",
				command: "codex test query",
				command_type: "codex",
			}),
		);

		// Test codex response handling
		server.send(
			JSON.stringify({
				type: "output",
				command: "codex",
				data: JSON.stringify({
					type: "message",
					role: "assistant",
					content: [{ text: "Assistant response" }],
					id: "123",
				}),
			}),
		);

		expect(result.current.messages).toContainEqual(
			expect.objectContaining({
				type: "assistant",
				content: "Assistant response",
				id: "123",
			}),
		);
	});

	it("should handle reconnection", async () => {
		const { result } = renderHook(() => useWebSocket());
		await server.connected;

		server.close();
		expect(result.current.connected).toBe(false);

		// Create new server to simulate reconnect
		server = new WS("ws://localhost:4000");
		await server.connected;

		expect(result.current.connected).toBe(true);
	});

	it("should clear messages", () => {
		const { result } = renderHook(() => useWebSocket());

		act(() => {
			result.current.clearMessages();
		});

		expect(result.current.messages).toEqual([
			expect.objectContaining({
				type: "system",
				content: "Chat cleared",
			}),
		]);
	});
});
