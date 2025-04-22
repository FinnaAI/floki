import { NextResponse } from "next/server";
import { exec, spawn, type ChildProcess } from "node:child_process";
import { promisify } from "node:util";
import { WebSocketServer, type WebSocket } from "ws";
import { createServer } from "node:http";
import path from "node:path";

// Declare type for global variable
declare global {
  var wsServerInitialized: boolean;
}

// This is necessary because NextJS API routes don't natively support WebSockets
// We need to create a raw HTTP server to attach the WebSocket server
const server = createServer();
const wss = new WebSocketServer({
  server,
  perMessageDeflate: false, // Disable compression to avoid bufferUtil issues
});
const port = process.env.WS_PORT || 4000; // Different from Next.js port

// Promisify exec for async/await
const execPromise = promisify(exec);

// Store active processes by WebSocket connection ID
const processes = new Map<string, ChildProcess>();

// Generate a unique session ID
const generateSessionId = () => Math.random().toString(36).substring(2);

// List of commands to show in the UI (for backward compatibility)
const allowedCommands = ["ls", "pwd", "echo", "date", "codex", "claude"];

// Standard REST API endpoint for non-interactive commands
export async function POST(request: Request) {
  try {
    const { command } = await request.json();

    // Input validation
    if (!command || typeof command !== "string") {
      return NextResponse.json(
        { error: "Command is required and must be a string" },
        { status: 400 }
      );
    }

    // Execute non-interactive command
    const { stdout, stderr } = await execPromise(command);

    if (stderr) {
      return NextResponse.json(
        { error: "Command execution failed", details: stderr },
        { status: 500 }
      );
    }

    return NextResponse.json({ output: stdout });
  } catch (error: unknown) {
    console.error("Error executing command:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Initialize the WebSocket server
if (!global.wsServerInitialized) {
  // WebSocket handling for interactive commands
  wss.on("connection", (ws: WebSocket) => {
    const sessionId = generateSessionId();
    console.log(`New WebSocket connection: ${sessionId}`);

    // Handle incoming messages (e.g., start command or send input)
    ws.on("message", (message: Buffer | string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "start" && data.command) {
          console.log(
            `Processing start command: ${data.command}, type: ${
              data.command_type || "standard"
            }`
          );

          try {
            // Special handling for internal commands
            if (data.internal) {
              console.log(`Running internal command: ${data.command}`);

              const proc = spawn(data.command, [], {
                cwd: process.cwd(),
                env: { ...process.env },
                shell: true,
              });

              let output = "";

              // Stream stdout
              proc.stdout.on("data", (data) => {
                output += data.toString();
              });

              // Stream stderr
              proc.stderr.on("data", (data) => {
                output += data.toString();
              });

              // Handle process exit
              proc.on("close", (code) => {
                ws.send(
                  JSON.stringify({
                    type: "output",
                    data: output,
                    internal: true,
                  })
                );
                ws.send(
                  JSON.stringify({
                    type: "exit",
                    code,
                    internal: true,
                  })
                );
              });

              return;
            }

            // Special handling for codex command
            if (
              data.command.startsWith("codex ") ||
              data.command_type === "codex"
            ) {
              console.log(`Running codex command: ${data.command}`);
              const isCodex = true;

              // Store the original Codex command
              const fullCommand = data.command;

              // Extract the query part
              const query = data.command.substring(6).trim();

              // Use quiet mode to get JSON output
              const proc = spawn("codex", ["-q", query], {
                cwd: process.cwd(),
                env: {
                  ...process.env,
                  NODE_NO_READLINE: "1",
                },
                shell: true,
              });

              // Store process
              processes.set(sessionId, proc);

              // Set a property on the process to identify it as a Codex process
              (proc as unknown as { isCodex: boolean }).isCodex = true;

              // Stream stdout
              proc.stdout.on("data", (rawData) => {
                const outputText = rawData.toString();
                console.log(
                  `Codex output received, length: ${outputText.length}`
                );

                // Try to send each line as a separate message
                const lines = outputText.split("\n");

                for (const line of lines) {
                  if (line.trim()) {
                    try {
                      // See if it's valid JSON before sending
                      const jsonData = JSON.parse(line);

                      // Include command info
                      ws.send(
                        JSON.stringify({
                          type: "output",
                          data: line,
                          command: "codex",
                          command_type: "codex",
                          json_type: jsonData.type, // Include the type of JSON (message, reasoning)
                        })
                      );
                    } catch (e) {
                      // If not valid JSON, just send as regular output
                      ws.send(
                        JSON.stringify({
                          type: "output",
                          data: `${line}\n`,
                          command: "codex",
                          command_type: "codex",
                        })
                      );
                    }
                  }
                }
              });

              // Stream stderr
              proc.stderr.on("data", (data) => {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    data: data.toString(),
                    command: "codex",
                    command_type: "codex",
                  })
                );
              });

              // Handle process exit
              proc.on("close", (code) => {
                ws.send(
                  JSON.stringify({
                    type: "exit",
                    code,
                    command: "codex",
                    command_type: "codex",
                  })
                );
                processes.delete(sessionId);
              });

              // Handle process errors
              proc.on("error", (err) => {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    data: `Error executing command: ${err.message}\n`,
                    command: "codex",
                    command_type: "codex",
                  })
                );
                processes.delete(sessionId);
              });
            } else {
              // Regular command handling
              const [cmd, ...args] = data.command.split(" ");
              const proc = spawn(cmd, args, {
                cwd: process.cwd(),
                env: { ...process.env },
                shell: true, // Use shell to support pipes, redirects, etc.
              });

              // Store process
              processes.set(sessionId, proc);

              // Send session ID to client
              ws.send(
                JSON.stringify({
                  type: "session",
                  sessionId: sessionId,
                })
              );

              // Stream stdout
              proc.stdout.on("data", (data) => {
                ws.send(
                  JSON.stringify({
                    type: "output",
                    data: data.toString(),
                    command: cmd,
                  })
                );
              });

              // Stream stderr
              proc.stderr.on("data", (data) => {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    data: data.toString(),
                    command: cmd,
                  })
                );
              });

              // Handle process exit
              proc.on("close", (code) => {
                ws.send(
                  JSON.stringify({
                    type: "exit",
                    code,
                    command: cmd,
                  })
                );
                processes.delete(sessionId);
              });

              // Handle process errors
              proc.on("error", (err) => {
                ws.send(
                  JSON.stringify({
                    type: "error",
                    data: `Error executing command: ${err.message}\n`,
                    command: cmd,
                  })
                );
                processes.delete(sessionId);
              });
            }
          } catch (err: unknown) {
            ws.send(
              JSON.stringify({
                type: "error",
                data: `Failed to start command: ${
                  err instanceof Error ? err.message : String(err)
                }\n`,
              })
            );
          }
        } else if (data.type === "input" && data.input) {
          // Send input to the process
          const proc = processes.get(sessionId);
          if (proc && proc.stdin) {
            proc.stdin.write(`${data.input}\n`);
          } else {
            // No active process - treat as a new command
            try {
              // Treat as a regular start command
              ws.send(
                JSON.stringify({
                  type: "start",
                  command: data.input,
                  command_type: data.command_type,
                })
              );
            } catch (err: unknown) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  data: `Failed to start command: ${
                    err instanceof Error ? err.message : String(err)
                  }\n`,
                })
              );
            }
          }
        } else if (data.type === "stop") {
          // Handle stop command - terminate the process
          const proc = processes.get(sessionId);
          if (proc) {
            console.log(`Stopping process for session: ${sessionId}`);
            try {
              // Try graceful termination first (SIGTERM)
              proc.kill("SIGTERM");

              // For safety, set a timeout to force kill if needed
              setTimeout(() => {
                if (processes.has(sessionId)) {
                  console.log(
                    `Force killing process for session: ${sessionId}`
                  );
                  proc.kill("SIGKILL");
                  processes.delete(sessionId);
                }
              }, 1000);

              // Notify client
              ws.send(
                JSON.stringify({
                  type: "system",
                  data: "Command terminated by user",
                })
              );
            } catch (err) {
              console.error(`Error stopping process: ${err}`);
              ws.send(
                JSON.stringify({
                  type: "error",
                  data: `Failed to stop command: ${err}`,
                })
              );
            }
          }
        }
      } catch (error: unknown) {
        ws.send(
          JSON.stringify({
            error: "Invalid message",
            details: error instanceof Error ? error.message : String(error),
          })
        );
      }
    });

    // Clean up on connection close
    ws.on("close", () => {
      const proc = processes.get(sessionId);
      if (proc) {
        proc.kill();
        processes.delete(sessionId);
      }
      console.log(`WebSocket connection closed: ${sessionId}`);
    });
  });

  // Start the WebSocket server
  server.listen(port, () => {
    console.log(`WebSocket server running on port ${port}`);
  });

  global.wsServerInitialized = true;
}

// GET endpoint to list allowed commands
export async function GET() {
  return NextResponse.json({
    allowedCommands,
    wsPort: port,
    info: "Connect to WebSocket on the specified port for interactive commands",
  });
}
