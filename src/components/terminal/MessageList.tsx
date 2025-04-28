import { Terminal as TerminalIcon } from "lucide-react";
import type { ChatMessage } from "./Codex";
import { AssistantMessage } from "./messages/AssistantMessage";
import { ReasoningMessage } from "./messages/ReasoningMessage";
import { SystemMessage } from "./messages/SystemMessage";
import { UserMessage } from "./messages/UserMessage";
import {
	CodexFunctionCall,
	CodexFunctionOutput,
	CodexQueryMessage,
	CodexReasoningMessage,
} from "./messages/codex";
import type { EnvVar } from "./useEnvVars";

interface MessageListProps {
	messages: ChatMessage[];
	envVars: EnvVar[];
}

export function MessageList({ messages, envVars }: MessageListProps) {
	// Filter out duplicate reasoning messages by tracking IDs
	const renderedIds = new Set<string>();
	const filteredMessages = messages.filter((message) => {
		// Only filter reasoning and assistant messages with IDs
		if (
			(message.type === "reasoning" || message.type === "assistant") &&
			message.id
		) {
			if (renderedIds.has(message.id)) {
				return false; // Skip this message, already seen this ID
			}
			renderedIds.add(message.id);
		}
		return true;
	});

	if (filteredMessages.length === 0) {
		return (
			<div className="flex h-64 flex-col items-center justify-center space-y-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/20">
					<TerminalIcon size={24} className="text-primary" />
				</div>
				<div className="space-y-1 text-center">
					<p className="font-medium text-foreground">Welcome to the Terminal</p>
					<p className="text-muted-foreground text-sm">
						Type{" "}
						<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-primary text-xs">
							help
						</code>{" "}
						to see available commands
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 space-y-3">
			{filteredMessages.map((message) => {
				const dateTime = message.timestamp.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				});

				// Use message ID or a combination of type and timestamp for the key
				const messageKey =
					message.id ||
					`${message.type}-${message.timestamp.getTime()}-${Math.random()
						.toString(36)
						.substring(2, 9)}`;

				switch (message.type) {
					case "user":
						return (
							<UserMessage
								key={messageKey}
								message={message}
								dateTime={dateTime}
							/>
						);

					case "system":
						return (
							<SystemMessage
								key={messageKey}
								message={message}
								dateTime={dateTime}
								envVars={envVars}
							/>
						);

					case "assistant":
						return (
							<AssistantMessage
								key={messageKey}
								message={message}
								dateTime={dateTime}
							/>
						);

					case "reasoning":
						// Check if it's a codex reasoning message with summary
						if (message.summary) {
							return (
								<CodexReasoningMessage
									key={messageKey}
									data={message}
									dateTime={dateTime}
								/>
							);
						}
						return (
							<ReasoningMessage
								key={messageKey}
								message={message}
								dateTime={dateTime}
							/>
						);
						
					case "function_call":
						return (
							<CodexFunctionCall
								key={messageKey}
								data={message}
								dateTime={dateTime}
							/>
						);
						
					case "function_output":
						return (
							<CodexFunctionOutput
								key={messageKey}
								data={message}
								dateTime={dateTime}
							/>
						);
						
					case "query":
						return (
							<CodexQueryMessage
								key={messageKey}
								query={String(message.content)}
								dateTime={dateTime}
							/>
						);

					default:
						return null;
				}
			})}
		</div>
	);
}
