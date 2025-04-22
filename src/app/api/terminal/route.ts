import { createServer } from "node:http";
import os from "node:os";
import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "node-pty";
import type { IPty } from "node-pty";
import { type WebSocket, WebSocketServer } from "ws";

// Terminal sessions store
interface TerminalSession {
	pty: IPty;
	createdAt: Date;
}

// Declare global type
declare global {
	var terminalWsServerInitialized: boolean;
	var terminals: Map<string, TerminalSession>;
}

// Initialize global terminals map if not exists
if (!global.terminals) {
	global.terminals = new Map<string, TerminalSession>();
}

// Generate a unique session ID
const generateSessionId = () => Math.random().toString(36).substring(2, 12);

// Get default shell based on OS
const getDefaultShell = (): string => {
	const platform = process.platform;
	if (platform === "win32") {
		return process.env.COMSPEC || "cmd.exe";
	}
	return process.env.SHELL || "/bin/bash";
};

// Set up WebSocket server for terminal communication
const TERMINAL_WS_PORT = Number.parseInt(
	process.env.TERMINAL_WS_PORT || "4001",
);

// Initialize WebSocket server
if (!global.terminalWsServerInitialized) {
	const server = createServer();
	const wss = new WebSocketServer({
		server,
		perMessageDeflate: false, // Disable compression
	});

	console.log(`Starting Terminal WebSocket server on port ${TERMINAL_WS_PORT}`);

	// Handle connections
	wss.on("connection", (ws: WebSocket) => {
		let sessionId: string | null = null;
		console.log("Terminal WebSocket connection established");

		// Handle incoming messages
		ws.on("message", (message: Buffer | string) => {
			try {
				const data = JSON.parse(message.toString());

				if (data.type === "create") {
					// Create a new terminal session
					sessionId = generateSessionId();
					const shell = getDefaultShell();
					const cwd = os.homedir();
					const cols = data.cols || 80;
					const rows = data.rows || 24;
					const env = data.env || {};

					// Spawn the shell as an *interactive login* shell so that ~/.zshrc (oh‑my‑zsh, powerlevel10k, etc.)
					// gets sourced and $PROMPT styling works. Also force 256‑colour + truecolour support so escape
					// sequences used by popular themes render correctly inside xterm.js.
					const pty = spawn(shell, ["-l"], {
						name: "xterm-256color",
						cols,
						rows,
						cwd,
						env: {
							...process.env,
							...env,
							TERM: "xterm-256color",
							COLORTERM: "truecolor",
						},
					});

					// Store session
					global.terminals.set(sessionId, {
						pty,
						createdAt: new Date(),
					});

					console.log(
						`Created terminal session ${sessionId} with shell ${shell}`,
					);

					// Send back session info
					ws.send(
						JSON.stringify({
							type: "created",
							id: sessionId,
							shell,
							cwd,
						}),
					);

					// Set up data handler
					pty.onData((data) => {
						if (ws.readyState === ws.OPEN) {
							ws.send(
								JSON.stringify({
									type: "data",
									data,
								}),
							);
						}
					});

					// Set up exit handler
					pty.onExit(({ exitCode, signal }) => {
						if (ws.readyState === ws.OPEN) {
							ws.send(
								JSON.stringify({
									type: "exit",
									exitCode,
									signal,
								}),
							);
						}

						if (sessionId) {
							global.terminals.delete(sessionId);
							sessionId = null;
						}
					});
				} else if (data.type === "input" && sessionId) {
					// Send input to terminal
					const session = global.terminals.get(sessionId);
					if (session) {
						session.pty.write(data.data);
					}
				} else if (data.type === "resize" && sessionId) {
					// Resize terminal
					const session = global.terminals.get(sessionId);
					if (session && data.cols && data.rows) {
						session.pty.resize(data.cols, data.rows);
					}
				} else if (data.type === "kill" && data.id) {
					// Kill terminal session
					const session = global.terminals.get(data.id);
					if (session) {
						session.pty.kill();
						global.terminals.delete(data.id);

						ws.send(
							JSON.stringify({
								type: "killed",
								id: data.id,
							}),
						);

						if (sessionId === data.id) {
							sessionId = null;
						}
					}
				}
			} catch (error) {
				console.error("Error handling terminal WebSocket message:", error);
				ws.send(
					JSON.stringify({
						type: "error",
						error: error instanceof Error ? error.message : "Unknown error",
					}),
				);
			}
		});

		// Handle disconnection
		ws.on("close", () => {
			console.log("Terminal WebSocket connection closed");
			if (sessionId) {
				const session = global.terminals.get(sessionId);
				if (session) {
					session.pty.kill();
					global.terminals.delete(sessionId);
				}
			}
		});
	});

	// Start the WebSocket server
	server.listen(TERMINAL_WS_PORT, () => {
		console.log(
			`Terminal WebSocket server running on port ${TERMINAL_WS_PORT}`,
		);
	});

	// Handle server errors
	server.on("error", (err: NodeJS.ErrnoException) => {
		console.error("Terminal WebSocket server error:", err);
		if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
			console.error(
				`Port ${TERMINAL_WS_PORT} is already in use. Try setting a different TERMINAL_WS_PORT in .env.local`,
			);
		}
	});

	global.terminalWsServerInitialized = true;
}

// Cleanup old terminal sessions periodically
const MAX_SESSION_AGE = 1000 * 60 * 30; // 30 minutes
setInterval(
	() => {
		const now = new Date();
		for (const [id, session] of global.terminals.entries()) {
			if (now.getTime() - session.createdAt.getTime() > MAX_SESSION_AGE) {
				console.log(`Cleaning up terminal session ${id} due to inactivity`);
				session.pty.kill();
				global.terminals.delete(id);
			}
		}
	},
	1000 * 60 * 5,
); // Check every 5 minutes

// GET endpoint to get terminal info
export async function GET() {
	return NextResponse.json({
		platform: process.platform,
		shell: getDefaultShell(),
		homeDir: os.homedir(),
		wsPort: TERMINAL_WS_PORT,
		info: "Use WebSockets to interact with the terminal",
		wsStatus: global.terminalWsServerInitialized
			? "running"
			: "not initialized",
	});
}

// POST endpoint for backward compatibility (starts a terminal and returns its ID)
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const cols = body.cols || 80;
		const rows = body.rows || 24;
		const env = body.env || {};

		// Generate a session ID
		const sessionId = generateSessionId();

		// Get shell info
		const shell = getDefaultShell();
		const cwd = os.homedir();

		// Spawn the shell as an *interactive login* shell so that ~/.zshrc (oh‑my‑zsh, powerlevel10k, etc.)
		// gets sourced and $PROMPT styling works. Also force 256‑colour + truecolour support so escape
		// sequences used by popular themes render correctly inside xterm.js.
		const pty = spawn(shell, ["-l"], {
			name: "xterm-256color",
			cols,
			rows,
			cwd,
			env: {
				...process.env,
				...env,
				TERM: "xterm-256color",
				COLORTERM: "truecolor",
			},
		});

		// Store session
		global.terminals.set(sessionId, {
			pty,
			createdAt: new Date(),
		});

		console.log(
			`Created terminal session ${sessionId} with shell ${shell} via REST API`,
		);

		// Return session info
		return NextResponse.json({
			success: true,
			id: sessionId,
			shell,
			cwd,
			wsPort: TERMINAL_WS_PORT,
		});
	} catch (error) {
		console.error("Error creating terminal session:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

// DELETE endpoint for backward compatibility
export async function DELETE(req: NextRequest) {
	try {
		const id = req.nextUrl.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{
					success: false,
					error: "Session ID required",
				},
				{ status: 400 },
			);
		}

		const session = global.terminals.get(id);
		if (!session) {
			console.log(`Terminal session not found: ${id}`);
			// Return success even if session not found to avoid client-side errors
			return NextResponse.json({
				success: true,
				message: "Terminal session not found or already terminated",
			});
		}

		try {
			console.log(`Killing terminal session ${id} via API`);
			session.pty.kill();
			global.terminals.delete(id);
			return NextResponse.json({
				success: true,
				message: "Terminal session terminated",
			});
		} catch (error) {
			console.error(`Error killing terminal session ${id}:`, error);
			return NextResponse.json(
				{
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Error in DELETE terminal endpoint:", error);
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
