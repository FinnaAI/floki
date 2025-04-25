import { BrainCircuit } from "lucide-react";
import type { ChatMessage } from "../Codex";

interface ReasoningMessageProps {
	message: ChatMessage;
	dateTime: string;
}

export function ReasoningMessage({ message, dateTime }: ReasoningMessageProps) {
	let content = message.content;
	let durationMs = 0;

	// Extract duration if available in the content
	if (typeof content === "string" && content.includes("duration_ms")) {
		try {
			const data = JSON.parse(content);
			if (data?.duration_ms) {
				durationMs = data.duration_ms;
				content = data.summary || content;
			}
		} catch (e) {
			// Not valid JSON, use content as is
		}
	}

	return (
		<div className="rounded-md border border-border border-l-4 border-l-amber-500 bg-background p-3">
			<div className="mb-2 flex items-center justify-between text-xs">
				<div className="flex items-center gap-1.5">
					<div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
						<BrainCircuit size={12} className="text-primary-foreground" />
					</div>
					<span className="font-medium text-amber-500">Reasoning</span>
					{durationMs > 0 && (
						<span className="ml-2 text-muted-foreground">
							({(durationMs / 1000).toFixed(2)}s)
						</span>
					)}
				</div>
				<span className="text-muted-foreground">{dateTime}</span>
			</div>
			<div className="whitespace-pre-wrap border-amber-400/30 border-l-2 py-1 pl-3 font-mono text-foreground text-sm">
				{typeof content === "string" ? (
					<div>
						{content.split("\n").map((line, i) => (
							<p key={`${message.id || ""}-line-${i}-${line.substring(0, 8)}`}>
								{line}
							</p>
						))}
					</div>
				) : (
					content
				)}
			</div>
		</div>
	);
}
