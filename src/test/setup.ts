import { expect, vi } from "vitest";

// Extend expect matchers for WebSocket testing
declare module "vitest" {
	interface Assertion<T> {
		toReceiveMessage(expected: string): Promise<void>;
	}
}

// Add custom matcher
expect.extend({
	async toReceiveMessage(ws: WebSocket, expected: string) {
		try {
			const received = await new Promise<string>((resolve) => {
				ws.onmessage = (event) => resolve(event.data);
			});

			return {
				pass: received === expected,
				message: () => `expected ${expected} but received ${received}`,
			};
		} catch (error) {
			return {
				pass: false,
				message: () => `WebSocket error: ${error}`,
			};
		}
	},
});

// Mock globals
global.WebSocket = vi.fn().mockImplementation(() => ({
	onmessage: null,
	send: vi.fn(),
	close: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
})) as unknown as typeof WebSocket;

global.MessageEvent = vi.fn().mockImplementation((type, init) => ({
	type,
	data: init?.data,
})) as unknown as typeof MessageEvent;

global.Worker = vi.fn().mockImplementation(() => ({
	onmessage: null,
	postMessage: vi.fn(),
	terminate: vi.fn(),
})) as unknown as typeof Worker;

// Mock fetch
global.fetch = vi.fn(() =>
	Promise.resolve({
		json: () => Promise.resolve({}),
		ok: true,
		status: 200,
	}),
) as unknown as typeof fetch;
