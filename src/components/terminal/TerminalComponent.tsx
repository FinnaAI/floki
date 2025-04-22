"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Terminal } from "xterm";
// eslint-disable-next-line import/no-extraneous-dependencies
import type { IDisposable } from "xterm";
import type { FitAddon } from "xterm-addon-fit";
import type { WebLinksAddon } from "xterm-addon-web-links";
import { useEnvVars } from "./useEnvVars";

interface TerminalComponentProps {
	onConnected: (isConnected: boolean) => void;
	onLoading: (isLoading: boolean) => void;
	onError: (errorMsg: string | null) => void;
	onShellChange: (shellName: string) => void;
}

export function TerminalComponent({
	onConnected,
	onLoading,
	onError,
	onShellChange,
}: TerminalComponentProps) {
	const terminalRef = useRef<HTMLDivElement | null>(null);
	const terminalInstance = useRef<Terminal | null>(null);
	const fitAddon = useRef<FitAddon | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const terminalId = useRef<string | null>(null);
	const dataListenerRef = useRef<IDisposable | null>(null);
	const { envVars } = useEnvVars();

	// Initialize and cleanup terminal
	useEffect(() => {
		let mounted = true;

		// Initialize terminal
		const initTerminal = async () => {
			if (!terminalRef.current || !mounted) return;

			try {
				onLoading(true);
				onError(null);

				// Ensure terminal container has dimensions
				const containerRect = terminalRef.current.getBoundingClientRect();
				if (containerRect.width === 0 || containerRect.height === 0) {
					console.error("Terminal container has zero dimensions");
					onError("Terminal container has invalid dimensions");
					onLoading(false);
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
				try {
					// CSS is imported in _app.js or via global.css
					// If you're seeing this error, add: import 'xterm/css/xterm.css'; to your _app.js
					console.info("Note: xterm.css should be imported in _app.js");
				} catch (cssErr) {
					console.warn("Could not load xterm.css:", cssErr);
				}

				// Clear any existing terminal
				if (terminalInstance.current) {
					terminalInstance.current.dispose();
				}

				// Create a new terminal instance with default small size
				const term = new Terminal({
					cursorBlink: true,
					cursorStyle: "block",
					// MesloLGS Nerd Font (bundled with oh‑my‑zsh themes like powerlevel10k) first so glyphs render
					fontFamily:
						'"MesloLGS NF", "Meslo LG S", Menlo, Monaco, "Courier New", monospace',
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
					},
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
					term.writeln(
						"Terminal initialized. Click Connect to start a session.",
					);
				} catch (openErr) {
					console.error("Error opening terminal:", openErr);
					onError(`Error opening terminal: ${(openErr as Error).message}`);
					onLoading(false);
					return;
				}

				// Wait for the terminal to fully render
				await new Promise((resolve) => setTimeout(resolve, 100));

				if (fitAddon.current && mounted) {
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
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

					const response = await fetch("/api/terminal", {
						signal: controller.signal,
					});
					clearTimeout(timeoutId);

					const data = await response.json();
					if (mounted) {
						onShellChange(data.shell || "unknown");
					}
				} catch (err) {
					console.error("Failed to get shell info:", err);
					term.writeln(
						"\r\n\x1b[33mWarning: Could not connect to terminal backend service. Some features may be limited.\x1b[0m",
					);
					term.writeln(
						"\r\n\x1b[33mPlease ensure the backend terminal API is running at http://localhost:3000/api/terminal\x1b[0m",
					);
					if (mounted) {
						onShellChange("unavailable");
						// Don't set error for API connection issue - just display in terminal
					}
				}

				if (mounted) {
					onLoading(false);
				}
			} catch (err) {
				console.error("Failed to initialize terminal:", err);
				if (mounted) {
					onError(`Failed to initialize terminal: ${(err as Error).message}`);
					onLoading(false);
				}
			}
		};

		// Connect to terminal backend
		const connectTerminal = async () => {
			if (!terminalInstance.current || !mounted) {
				return;
			}

			try {
				const cols = terminalInstance.current.cols;
				const rows = terminalInstance.current.rows;

				// Get terminal info and websocket port
				let wsPort = 4001; // Default WebSocket port
				try {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

					const infoResponse = await fetch("/api/terminal", {
						signal: controller.signal,
					});
					clearTimeout(timeoutId);

					const terminalInfo = await infoResponse.json();
					wsPort = terminalInfo.wsPort || 4001;
				} catch (err) {
					console.error("Failed to get terminal WebSocket info:", err);
					terminalInstance.current.writeln(
						"\r\n\x1b[31mCannot connect to terminal backend. Please ensure the server is running.\x1b[0m",
					);
					onError("Cannot connect to terminal backend service");
					return;
				}

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
					if (!mounted) return;

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
					if (!mounted) return;

					try {
						const message = JSON.parse(event.data);

						if (message.type === "created") {
							terminalId.current = message.id;
							onShellChange(message.shell || "unknown");
							terminalInstance.current?.writeln(
								`\r\n\x1b[32mTerminal session ready with ID: ${message.id}\x1b[0m`,
							);
							onConnected(true);
						} else if (message.type === "data") {
							terminalInstance.current?.write(message.data);
						} else if (message.type === "exit") {
							terminalInstance.current?.writeln(
								`\r\n\x1b[31mTerminal process exited with code ${message.exitCode}\x1b[0m`,
							);
							onConnected(false);
						} else if (message.type === "killed") {
							terminalInstance.current?.writeln(
								"\r\n\x1b[31mTerminal process terminated\x1b[0m",
							);
							onConnected(false);
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
					if (!mounted) return;

					if (terminalInstance.current) {
						terminalInstance.current.writeln(
							"\r\n\x1b[31mWebSocket disconnected\x1b[0m",
						);
						onConnected(false);
					}
				};

				ws.onerror = (event) => {
					if (!mounted) return;

					console.error("WebSocket error:", event);
					if (terminalInstance.current) {
						terminalInstance.current.writeln(
							"\r\n\x1b[31mWebSocket connection error\x1b[0m",
						);
						onConnected(false);
					}
					onError("WebSocket connection error");
				};

				// Dispose any previous listener to avoid duplicate input after reconnects
				if (dataListenerRef.current) {
					dataListenerRef.current.dispose();
				}

				dataListenerRef.current = terminalInstance.current.onData((data) => {
					if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
						wsRef.current.send(
							JSON.stringify({
								type: "input",
								data,
							}),
						);
					}
				});

				return () => {
					dataListenerRef.current?.dispose();
					dataListenerRef.current = null;
				};
			} catch (err) {
				console.error("Failed to connect to terminal:", err);
				if (mounted && terminalInstance.current) {
					terminalInstance.current.writeln(
						`\r\n\x1b[31mError: ${(err as Error).message}\x1b[0m`,
					);
				}
				onError(`Failed to connect: ${(err as Error).message}`);
			}
		};

		// Kill the current terminal process
		const killTerminal = async () => {
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
					const response = await fetch(
						`/api/terminal?id=${terminalId.current}`,
						{
							method: "DELETE",
						},
					);

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

				onConnected(false);
				terminalId.current = null;
			} catch (err) {
				console.error("Failed to kill terminal:", err);
				if (terminalInstance.current) {
					terminalInstance.current.writeln(
						`\r\n\x1b[31mError killing terminal: ${
							(err as Error).message
						}\x1b[0m`,
					);
				}
			}
		};

		// Clear the terminal screen
		const clearTerminal = () => {
			if (terminalInstance.current) {
				terminalInstance.current.clear();
			}
		};

		// Register event listeners
		window.addEventListener("terminal:connect", connectTerminal);
		window.addEventListener("terminal:kill", killTerminal);
		window.addEventListener("terminal:clear", clearTerminal);

		// Handle window resize
		const handleResize = () => {
			if (
				!terminalRef.current ||
				!terminalInstance.current ||
				!fitAddon.current ||
				!mounted
			)
				return;

			setTimeout(() => {
				if (!mounted) return;

				if (
					terminalRef.current &&
					terminalInstance.current &&
					fitAddon.current
				) {
					try {
						fitAddon.current.fit();

						// Send resize info if connected
						if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
							const cols = terminalInstance.current.cols;
							const rows = terminalInstance.current.rows;

							wsRef.current.send(
								JSON.stringify({
									type: "resize",
									cols,
									rows,
								}),
							);
						}
					} catch (err) {
						console.error("Error handling resize:", err);
					}
				}
			}, 200);
		};

		window.addEventListener("resize", handleResize);

		// Initialize terminal with delay to ensure DOM is ready
		setTimeout(initTerminal, 200);

		// Cleanup function
		return () => {
			mounted = false;

			window.removeEventListener("terminal:connect", connectTerminal);
			window.removeEventListener("terminal:kill", killTerminal);
			window.removeEventListener("terminal:clear", clearTerminal);
			window.removeEventListener("resize", handleResize);

			// Close WebSocket connection
			if (wsRef.current) {
				wsRef.current.close();
			}

			// Dispose listeners & terminal
			dataListenerRef.current?.dispose();
			dataListenerRef.current = null;

			if (terminalInstance.current) {
				terminalInstance.current.dispose();
			}
		};
	}, [envVars, onConnected, onError, onLoading, onShellChange]);

	return (
		<div
			ref={terminalRef}
			className="h-full w-full"
			style={{ padding: "2px" }}
		/>
	);
}
