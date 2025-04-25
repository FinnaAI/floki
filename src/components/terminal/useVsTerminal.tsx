"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Terminal } from "xterm";
import type { ITheme } from "xterm";
import type { FitAddon } from "xterm-addon-fit";
import { useEnvVars } from "./useEnvVars";

export interface TerminalOptions {
	cwd?: string;
	cols?: number;
	rows?: number;
}

export function useVsTerminal() {
	const [connected, setConnected] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [shell, setShell] = useState("");

	const terminalRef = useRef<HTMLDivElement | null>(null);
	const terminalInstance = useRef<Terminal | null>(null);
	const fitAddon = useRef<FitAddon | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const terminalId = useRef<string | null>(null);

	const { envVars } = useEnvVars();

	// Handle terminal resize - includes connected in dependencies
	const handleResize = useCallback(() => {
		if (typeof window === "undefined") return;

		if (
			fitAddon.current &&
			terminalInstance.current &&
			wsRef.current &&
			connected
		) {
			try {
				fitAddon.current.fit();
				const cols = terminalInstance.current.cols;
				const rows = terminalInstance.current.rows;

				// Send resize information to server
				wsRef.current.send(
					JSON.stringify({
						type: "resize",
						cols,
						rows,
					}),
				);
			} catch (err) {
				console.error("Error handling resize:", err);
			}
		}
	}, [connected]);

	// Connect to terminal backend
	const connectTerminal = useCallback(async () => {
		if (!terminalInstance.current || typeof window === "undefined") {
			return;
		}

		try {
			const cols = terminalInstance.current.cols;
			const rows = terminalInstance.current.rows;

			// Get terminal info and websocket port
			const infoResponse = await fetch("/api/terminal");
			const terminalInfo = await infoResponse.json();
			const wsPort = terminalInfo.wsPort || 4001;

			// Close any existing connection
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}

			terminalInstance.current.writeln(
				"\r\n\x1b[33mConnecting to terminal server...\x1b[0m",
			);

			// Connect directly via WebSocket
			const host = window.location.hostname;
			const wsUrl = `ws://${host}:${wsPort}`;

			console.log(`Connecting to terminal WebSocket at ${wsUrl}`);

			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			// Set up WebSocket event listeners
			ws.onopen = () => {
				terminalInstance.current?.writeln(
					"\r\n\x1b[32mWebSocket connected\x1b[0m",
				);

				// Create a new terminal session
				ws.send(
					JSON.stringify({
						type: "create",
						cols,
						rows,
						env: envVars,
					}),
				);
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);

					if (message.type === "created") {
						terminalId.current = message.id;
						setShell(message.shell);
						terminalInstance.current?.writeln(
							`\r\n\x1b[32mTerminal session ready with ID: ${message.id}\x1b[0m`,
						);
						setConnected(true);
					} else if (message.type === "data") {
						terminalInstance.current?.write(message.data);
					} else if (message.type === "exit") {
						terminalInstance.current?.writeln(
							`\r\n\x1b[31mTerminal process exited with code ${message.exitCode}\x1b[0m`,
						);
						setConnected(false);
					} else if (message.type === "killed") {
						terminalInstance.current?.writeln(
							"\r\n\x1b[31mTerminal process terminated\x1b[0m",
						);
						setConnected(false);
					} else if (message.type === "error") {
						terminalInstance.current?.writeln(
							`\r\n\x1b[31mError: ${message.error}\x1b[0m`,
						);
					}
				} catch (err) {
					console.error("Error parsing WebSocket message:", err);
				}
			};

			ws.onclose = () => {
				if (terminalInstance.current) {
					terminalInstance.current.writeln(
						"\r\n\x1b[31mWebSocket disconnected\x1b[0m",
					);
					setConnected(false);
				}
			};

			ws.onerror = (event) => {
				console.error("WebSocket error:", event);
				if (terminalInstance.current) {
					terminalInstance.current.writeln(
						"\r\n\x1b[31mWebSocket connection error\x1b[0m",
					);
					setConnected(false);
				}
				setError("WebSocket connection error");
			};

			// Handle user input
			terminalInstance.current.onData((data) => {
				if (
					wsRef.current &&
					wsRef.current.readyState === WebSocket.OPEN &&
					connected
				) {
					wsRef.current.send(
						JSON.stringify({
							type: "input",
							data,
						}),
					);
				}
			});
		} catch (err) {
			console.error("Failed to connect to terminal:", err);
			if (terminalInstance.current) {
				terminalInstance.current.writeln(
					`\r\n\x1b[31mError: ${(err as Error).message}\x1b[0m`,
				);
			}
			setError(`Failed to connect: ${(err as Error).message}`);
		}
	}, [envVars, connected]);

	// Initialize terminal
	const initTerminal = useCallback(async () => {
		if (!terminalRef.current || typeof window === "undefined") return;

		try {
			setLoading(true);

			// Give the DOM time to render the container fully
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Double-check that the DOM element is still there after the delay
			if (!terminalRef.current) {
				console.error("Terminal container not found after delay");
				setError("Terminal container not found");
				setLoading(false);
				return;
			}

			// Ensure terminal container has dimensions
			const containerRect = terminalRef.current.getBoundingClientRect();
			if (containerRect.width === 0 || containerRect.height === 0) {
				console.error("Terminal container has zero dimensions");
				setError("Terminal container has invalid dimensions");
				setLoading(false);
				return;
			}

			// Set minimum dimensions for the terminal container to prevent xterm.js errors
			terminalRef.current.style.minWidth = "100px";
			terminalRef.current.style.minHeight = "100px";
			terminalRef.current.style.width = "100%";
			terminalRef.current.style.height = "100%";

			// Dynamically import modules on client side
			const { Terminal } = await import("xterm");
			const { FitAddon } = await import("xterm-addon-fit");
			const { WebLinksAddon } = await import("xterm-addon-web-links");

			// Dynamic import for CSS
			// CSS is imported globally in globals.css
			console.info("Note: xterm.css should be imported in globals.css");

			// Clear any existing terminal
			if (terminalInstance.current) {
				terminalInstance.current.dispose();
			}

			// Create a new terminal instance with default small size to ensure dimension calculation works
			const term = new Terminal({
				cursorBlink: true,
				cursorStyle: "block",
				fontFamily: 'Menlo, Monaco, "Courier New", monospace',
				fontSize: 14,
				lineHeight: 1.2,
				cols: 80, // Start with a standard size
				rows: 24, // Start with a standard size
				theme: {
					background: "#1e1e1e",
					foreground: "#d4d4d4",
					cursor: "#aeafad",
					selectionBackground: "rgba(255, 255, 255, 0.3)",
					black: "#000000",
					red: "#cd3131",
					green: "#0dbc79",
					yellow: "#e5e510",
					blue: "#2472c8",
					magenta: "#bc3fbc",
					cyan: "#11a8cd",
					white: "#e5e5e5",
					brightBlack: "#666666",
					brightRed: "#f14c4c",
					brightGreen: "#23d18b",
					brightYellow: "#f5f543",
					brightBlue: "#3b8eea",
					brightMagenta: "#d670d6",
					brightCyan: "#29b8db",
					brightWhite: "#e5e5e5",
				} as ITheme,
				allowTransparency: true,
			});

			// Store terminal instance right away
			terminalInstance.current = term;

			// Create addons
			const newFitAddon = new FitAddon();
			fitAddon.current = newFitAddon;
			const webLinksAddon = new WebLinksAddon();

			// Load addons
			term.loadAddon(newFitAddon);
			term.loadAddon(webLinksAddon);

			try {
				// Open terminal in the container
				term.open(terminalRef.current);
				term.writeln("Terminal initialized. Connecting to shell...");
			} catch (openErr) {
				console.error("Error opening terminal:", openErr);
				setError(`Error opening terminal: ${(openErr as Error).message}`);
				setLoading(false);
				return;
			}

			// Wait for the terminal to fully render
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (fitAddon.current) {
				try {
					fitAddon.current.fit();
					console.log(
						"Terminal fitted to container:",
						term.cols,
						"x",
						term.rows,
					);
				} catch (fitErr) {
					console.error("Error fitting terminal:", fitErr);
					// Fallback to default size if fit fails
					term.resize(80, 24);
				}
			}

			// Get shell info
			try {
				const response = await fetch("/api/terminal");
				const data = await response.json();
				setShell(data.shell);
			} catch (err) {
				console.error("Failed to get shell info:", err);
				term.writeln(
					`\r\n\x1b[31mError getting shell info: ${
						(err as Error).message
					}\x1b[0m`,
				);
			}

			setLoading(false);

			// Handle terminal resize
			const handleResize = () => {
				console.log("Window resize detected");
				if (
					!terminalRef.current ||
					!terminalInstance.current ||
					!fitAddon.current
				)
					return;

				setTimeout(() => {
					if (
						terminalRef.current &&
						terminalInstance.current &&
						fitAddon.current
					) {
						try {
							fitAddon.current.fit();
							handleResizeEvent();
						} catch (err) {
							console.error("Error handling resize:", err);
						}
					}
				}, 200);
			};

			const handleResizeEvent = () => {
				if (
					!terminalRef.current ||
					!terminalInstance.current ||
					!fitAddon.current
				)
					return;

				if (
					wsRef.current &&
					wsRef.current.readyState === WebSocket.OPEN &&
					connected
				) {
					const cols = terminalInstance.current.cols;
					const rows = terminalInstance.current.rows;
					console.log("Sending resize to server:", cols, "x", rows);

					// Send resize information to server
					wsRef.current.send(
						JSON.stringify({
							type: "resize",
							cols,
							rows,
						}),
					);
				}
			};

			window.addEventListener("resize", handleResize);

			return () => {
				window.removeEventListener("resize", handleResize);
			};
		} catch (err) {
			console.error("Failed to initialize terminal:", err);
			setError(`Failed to initialize terminal: ${(err as Error).message}`);
			setLoading(false);
		}
	}, [connected]);

	// Send a command to the terminal
	const sendCommand = useCallback(
		(command: string) => {
			if (!terminalInstance.current || !connected) {
				setError("Terminal not connected");
				return;
			}

			if (
				wsRef.current &&
				wsRef.current.readyState === WebSocket.OPEN &&
				connected
			) {
				wsRef.current.send(
					JSON.stringify({
						type: "input",
						data: `${command}\r`,
					}),
				);
			}
		},
		[connected],
	);

	// Kill the current terminal process
	const killTerminal = useCallback(async () => {
		if (!terminalId.current) {
			if (terminalInstance.current) {
				terminalInstance.current.writeln(
					"\r\n\x1b[31mNo active terminal session to kill\x1b[0m",
				);
			}
			return;
		}

		try {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				console.log(
					`Killing terminal session via WebSocket: ${terminalId.current}`,
				);
				wsRef.current.send(
					JSON.stringify({
						type: "kill",
						id: terminalId.current,
					}),
				);
			} else {
				console.log(
					`Killing terminal session via REST API: ${terminalId.current}`,
				);
				// Fallback to REST API
				const response = await fetch(`/api/terminal?id=${terminalId.current}`, {
					method: "DELETE",
				});

				if (!response.ok) {
					throw new Error(
						`Server returned ${response.status}: ${response.statusText}`,
					);
				}

				if (terminalInstance.current) {
					terminalInstance.current.writeln(
						"\r\n\x1b[31mTerminal process terminated\x1b[0m",
					);
				}
			}

			setConnected(false);
			terminalId.current = null;
		} catch (err) {
			console.error("Failed to kill terminal:", err);
			if (terminalInstance.current) {
				terminalInstance.current.writeln(
					`\r\n\x1b[31mError killing terminal: ${(err as Error).message}\x1b[0m`,
				);
			}
		}
	}, []);

	// Clear the terminal
	const clearTerminal = useCallback(() => {
		if (terminalInstance.current) {
			terminalInstance.current.clear();
		}
	}, []);

	// Auto-initialize on mount
	useEffect(() => {
		let cleanupFunction: (() => void) | undefined;

		if (typeof window !== "undefined") {
			// Delay initialization to ensure DOM is ready
			const initTimer = setTimeout(async () => {
				cleanupFunction = await initTerminal();
			}, 500);

			return () => {
				clearTimeout(initTimer);
				// Execute the cleanup function from initTerminal if it exists
				if (cleanupFunction) cleanupFunction();

				// Clean up when component unmounts
				if (connected) {
					killTerminal();
				}

				// Close WebSocket connection
				if (wsRef.current) {
					wsRef.current.close();
				}
			};
		}

		return undefined;
	}, [initTerminal, connected, killTerminal]);

	return {
		connected,
		loading,
		error,
		shell,
		terminalRef,
		initTerminal,
		sendCommand,
		connectTerminal,
		killTerminal,
		clearTerminal,
	};
}
