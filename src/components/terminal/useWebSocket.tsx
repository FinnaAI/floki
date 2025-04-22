"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "./Codex";

export function useWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wsPort, setWsPort] = useState(4000);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [isReconnecting, setIsReconnecting] = useState(false);
  const processedMessageIds = useRef(new Set<string>());
  const activeSessionId = useRef<string | null>(null);

  // Add a message to chat
  const addMessage = useCallback((message: ChatMessage) => {
    // If the message has an ID and we've already processed it, skip
    if (message.id && processedMessageIds.current.has(message.id)) {
      return;
    }

    // Add message ID to processed set if it exists
    if (message.id) {
      processedMessageIds.current.add(message.id);
    }

    setMessages((prev) => [...prev, message]);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([
      {
        type: "system",
        content: "Chat cleared",
        timestamp: new Date(),
      },
    ]);
    processedMessageIds.current.clear();
  }, []);

  // Fetch WebSocket port on component mount
  useEffect(() => {
    fetch("/api/commands")
      .then((res) => res.json())
      .then((data) => {
        setWsPort(data.wsPort);
        addMessage({
          type: "system",
          content: "Welcome to Terminal. Type any command to get started.",
          timestamp: new Date(),
        });
      })
      .catch((err) => {
        console.error("Failed to fetch commands info:", err);
        addMessage({
          type: "system",
          content: "Failed to fetch commands info",
          timestamp: new Date(),
        });
      });
  }, [addMessage]);

  // Connect immediately on load
  useEffect(() => {
    if (wsPort && !connected && !ws.current) {
      connectWebSocket();
    }
  }, [wsPort, connected]);

  // Try to load env vars from .env file
  useEffect(() => {
    if (connected && ws.current) {
      ws.current.send(
        JSON.stringify({
          type: "start",
          command: "cat .env 2>/dev/null || echo 'No .env file found'",
          internal: true, // Mark as internal command
        })
      );
    }
  }, [connected]);

  // Reconnect logic with exponential backoff
  const reconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      addMessage({
        type: "system",
        content:
          "Max reconnection attempts reached. Please try again manually.",
        timestamp: new Date(),
      });
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
      return;
    }

    reconnectAttempts.current += 1;
    const backoffTime = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);

    addMessage({
      type: "system",
      content: `Attempting to reconnect in ${
        backoffTime / 1000
      } seconds (attempt ${reconnectAttempts.current})...`,
      timestamp: new Date(),
    });

    setTimeout(() => {
      if (!connected) {
        connectWebSocket();
      }
    }, backoffTime);
  }, [connected, addMessage]);

  // Send a command through the WebSocket
  const sendCommand = useCallback(
    (command: string, isInternalCommand = false, addUserMessage = false) => {
      // Always show the command in the terminal
      if (!isInternalCommand) {
        addMessage({
          type: "user",
          content: command,
          timestamp: new Date(),
        });
      } else if (addUserMessage) {
        // Only add user message for internal commands if explicitly requested
        addMessage({
          type: "user",
          content: command,
          timestamp: new Date(),
        });
      }

      // Special handling for built-in commands
      if (command === "help" && isInternalCommand) {
        addMessage({
          type: "system",
          content: "Available Commands:",
          timestamp: new Date(),
        });
        return;
      }

      if (command === "env" && isInternalCommand) {
        addMessage({
          type: "system",
          content: "env",
          timestamp: new Date(),
        });
        return;
      }

      // Special handling for stop command
      if (command === "STOP_COMMAND" && isInternalCommand) {
        if (
          ws.current &&
          ws.current.readyState === WebSocket.OPEN &&
          activeSessionId.current
        ) {
          ws.current.send(
            JSON.stringify({
              type: "stop",
              sessionId: activeSessionId.current,
            })
          );
          addMessage({
            type: "system",
            content: "Stopping command...",
            timestamp: new Date(),
          });
        }
        return;
      }

      // Process regular command through WebSocket
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        // Special handling for codex command
        if (command.startsWith("codex ")) {
          const commandObj = {
            type: "start",
            command: command,
            command_type: "codex",
          };
          ws.current.send(JSON.stringify(commandObj));
        } else {
          ws.current.send(
            JSON.stringify({
              type: "start",
              command: command,
              internal: isInternalCommand,
            })
          );
        }
      } else {
        addMessage({
          type: "system",
          content: "Not connected to server. Reconnecting...",
          timestamp: new Date(),
        });
        connectWebSocket();

        // Queue command to be sent after connection
        setTimeout(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            if (command.startsWith("codex ")) {
              ws.current.send(
                JSON.stringify({
                  type: "start",
                  command: command,
                  command_type: "codex",
                })
              );
            } else {
              ws.current.send(
                JSON.stringify({
                  type: "start",
                  command: command,
                  internal: isInternalCommand,
                })
              );
            }
          } else {
            addMessage({
              type: "system",
              content: "Failed to connect. Please try again.",
              timestamp: new Date(),
            });
          }
        }, 1000);
      }
    },
    [addMessage]
  );

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      setConnected(true);
      return;
    }

    // Clean up any existing connection
    if (ws.current) {
      try {
        ws.current.close();
      } catch (e) {
        console.error("Error closing existing connection:", e);
      }
    }

    // Get host from window
    const host = window.location.hostname;
    try {
      ws.current = new WebSocket(`ws://${host}:${wsPort}`);

      ws.current.onopen = () => {
        setConnected(true);
        setIsReconnecting(false);
        reconnectAttempts.current = 0;
        addMessage({
          type: "system",
          content: "Connected to server",
          timestamp: new Date(),
        });
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(
            "Received message:",
            data.type,
            data.command,
            data.command_type
          );

          // Handle internal commands differently
          if (data.internal) {
            if (data.type === "output" && data.data) {
              // Internal command output is processed elsewhere
              console.log("Internal command output:", data.data);
            }
          } else if (data.type === "output" || data.type === "error") {
            // Process output for Codex commands
            if (data.command === "codex" || data.command_type === "codex") {
              const content = data.data.trim();
              console.log(
                `Processing Codex output: ${content.substring(0, 50)}...`
              );

              try {
                // Try to parse the JSON response
                if (content.startsWith("{") && content.endsWith("}")) {
                  const parsedData = JSON.parse(content);
                  console.log(
                    "Parsed Codex JSON:",
                    parsedData.type,
                    parsedData.role || ""
                  );

                  // Use the json_type from the server when available
                  const jsonType = data.json_type || parsedData.type;

                  // Handle reasoning message
                  if (jsonType === "reasoning" && parsedData.summary) {
                    const summary = parsedData.summary[0]?.text || "";
                    const durationMs = parsedData.duration_ms || 0;

                    addMessage({
                      type: "reasoning",
                      content: summary,
                      timestamp: new Date(),
                      id: parsedData.id,
                    });
                    return;
                  }

                  // Handle assistant message
                  if (
                    jsonType === "message" &&
                    parsedData.role === "assistant" &&
                    parsedData.content
                  ) {
                    const messageText = parsedData.content[0]?.text || "";

                    addMessage({
                      type: "assistant",
                      content: messageText,
                      timestamp: new Date(),
                      id: parsedData.id,
                    });
                    return;
                  }

                  // Handle user message
                  if (
                    jsonType === "message" &&
                    parsedData.role === "user" &&
                    parsedData.content
                  ) {
                    const userText = parsedData.content[0]?.text || "";

                    addMessage({
                      type: "system",
                      content: `Codex query: "${userText}"`,
                      timestamp: new Date(),
                    });
                    return;
                  }
                }

                // If we get here, it's not a recognized JSON format, just show as plain text
                addMessage({
                  type: "system",
                  content: content,
                  timestamp: new Date(),
                });
              } catch (e) {
                // Not valid JSON or other error, show as plain text
                addMessage({
                  type: "system",
                  content: content,
                  timestamp: new Date(),
                });
              }
            } else {
              // Process regular commands
              addMessage({
                type: "system",
                content: data.data,
                timestamp: new Date(),
              });
            }
          } else if (data.type === "exit") {
            // Do nothing when command exits
            // Reset active session ID when command completes
            activeSessionId.current = null;
          } else if (data.type === "error") {
            addMessage({
              type: "system",
              content: `Error: ${data.error}`,
              timestamp: new Date(),
            });
          } else if (data.type === "session") {
            // Store the session ID for command control
            activeSessionId.current = data.sessionId;
            console.log(`Active session ID: ${data.sessionId}`);
          } else if (data.type === "system") {
            // System messages from the server
            addMessage({
              type: "system",
              content: data.data,
              timestamp: new Date(),
            });
          }
        } catch (err) {
          console.error("Error parsing message:", err, event.data);
          addMessage({
            type: "system",
            content: `Error parsing message: ${
              (err as Error).message || String(err)
            }`,
            timestamp: new Date(),
          });
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        addMessage({
          type: "system",
          content: "Connection closed",
          timestamp: new Date(),
        });

        // Only trigger reconnect if it wasn't a normal closure
        if (!isReconnecting) {
          setIsReconnecting(true);
          reconnect();
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        addMessage({
          type: "system",
          content: "Connection error occurred",
          timestamp: new Date(),
        });

        // If there's an error, close the connection
        if (ws.current) {
          try {
            ws.current.close();
          } catch (e) {
            console.error("Error closing connection after error:", e);
          }
        }
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      addMessage({
        type: "system",
        content: `Failed to connect: ${(err as Error).message || String(err)}`,
        timestamp: new Date(),
      });
    }
  }, [addMessage, wsPort, isReconnecting, reconnect]);

  return {
    connected,
    messages,
    sendCommand,
    connectWebSocket,
    clearMessages,
  };
}
