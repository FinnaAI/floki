"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Power, Square, Trash } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { CommandInput } from "./CommandInput";
import { EnvVarForm } from "./EnvVarForm";
import { MessageList } from "./MessageList";
import { useEnvVars } from "./useEnvVars";
import { useWebSocket } from "./useWebSocket";

export interface ChatMessage {
	type:
		| "user"
		| "system"
		| "assistant"
		| "reasoning"
		| "function_call"
		| "function_output"
		| "query";
	content: string | React.ReactNode;
	timestamp: Date;
	id?: string;
	role?: "user" | "assistant" | "system";
	status?: "completed" | "in_progress" | "error";
	summary?: { type: string; text: string }[];
	duration_ms?: number;
	function_data?: {
		name?: string;
		arguments?: Record<string, unknown>;
		call_id?: string;
		output?: Record<string, unknown> | string;
		metadata?: {
			exit_code?: number;
			duration_seconds?: number;
		};
	};
}

export function Codex() {
	const [input, setInput] = useState("");
	const [showEnvModal, setShowEnvModal] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const [codexMode, setCodexMode] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [model, setModel] = useState("o4-mini");
	const [provider, setProvider] = useState("openai");

	// Custom hooks
	const { connected, messages, sendCommand, connectWebSocket, clearMessages } =
		useWebSocket();

	const { envVars, addEnvVar, applyEnvVars } = useEnvVars();

	// Auto-scroll to bottom of chat when messages change
	useLayoutEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				"[data-radix-scroll-area-viewport]",
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}); // Always run after each render

	// Handle model change
	const handleModelChange = (newModel: string) => {
		setModel(newModel);
	};

	// Handle provider change
	const handleProviderChange = (newProvider: string) => {
		setProvider(newProvider);
	};

	// Handle sending command
	const handleSendCommand = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && input.trim()) {
			const command = input.trim();
			processCommand(command);
			setInput("");
		}
	};

	// Process special commands
	const processCommand = (command: string) => {
		// First, add the user message
		sendCommand(command, true);

		// Handle built-in commands
		if (command === "env" || command === "env show") {
			// Display environment variables handled by MessageList
			return;
		}

		if (command === "env add" || command === "env edit") {
			setShowEnvModal(true);
			return;
		}

		if (command.startsWith("env set ")) {
			const parts = command.substring(8).trim().split("=");
			if (parts && parts.length >= 2) {
				const key = parts[0]?.trim() || "";
				const value = parts.slice(1).join("=").trim();
				if (key) {
					addEnvVar(key, value);
				}
			}
			return;
		}

		if (command === "help") {
			// Help message handled by SystemMessage component
			sendCommand("help", true);
			return;
		}

		if (command === "clear") {
			clearMessages();
			return;
		}

		// Apply environment variables to the command
		let processedCommand = applyEnvVars(command);

		// Add codex prefix if codex mode is enabled
		if (codexMode && !processedCommand.startsWith("codex")) {
			processedCommand = `codex -m ${model} --provider ${provider} -q "${processedCommand}"`;
		}

		// Send command to WebSocket
		sendCommand(processedCommand);
	};

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-full w-full flex-col justify-between overflow-hidden bg-background">
				{/* Header */}
				<div className="flex items-center justify-end border-t">
					<div className="flex items-center gap-1">
						<Button
							variant={connected ? "secondary" : "default"}
							size="sm"
							onClick={connectWebSocket}
							disabled={connected}
							className="gap-1"
						>
							<Power size={14} />
							<span>{connected ? "Connected" : "Connect"}</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={clearMessages}
							title="Clear messages"
						>
							<Trash size={14} />
						</Button>
					</div>
				</div>

				{/* Content - scrollable area that fills available space */}
				<div className="flex-1 overflow-hidden">
					<ScrollArea className="h-full" ref={scrollAreaRef}>
						<div className="p-3">
							<MessageList messages={messages} envVars={envVars} />
						</div>
					</ScrollArea>
				</div>

				{/* Input area - always at the bottom */}
				<div className="flex shrink-0 border-border border-t bg-background p-2">
					<div className="flex h-full w-full gap-1">
						<CommandInput
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleSendCommand}
							connected={connected}
							placeholder="Enter message for Codex..."
							onModelChange={handleModelChange}
							onProviderChange={handleProviderChange}
						/>
						<Button
							variant="destructive"
							size="icon"
							onClick={() => sendCommand("STOP_COMMAND", true)}
							title="Stop running command (Ctrl+C)"
						>
							<Square size={14} />
						</Button>
					</div>
				</div>
			</div>

			{/* Environment Variables Modal */}
			<Dialog open={showEnvModal} onOpenChange={setShowEnvModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Environment Variables</DialogTitle>
					</DialogHeader>
					<EnvVarForm
						envVars={envVars}
						onAddEnvVar={addEnvVar}
						onClose={() => setShowEnvModal(false)}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowEnvModal(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
