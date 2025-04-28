"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../Codex";

interface ReasoningData {
	summary?: { type: string; text: string }[];
	content?: string;
	id?: string;
}

interface CodexReasoningMessageProps {
	data: ReasoningData | string | ChatMessage;
	dateTime: string;
}

export function CodexReasoningMessage({
	data,
	dateTime,
}: CodexReasoningMessageProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Parse data depending on type
	let jsonData: Partial<ReasoningData> = {};
	if (typeof data === "string") {
		try {
			jsonData = JSON.parse(data);
		} catch {
			jsonData = { content: data };
		}
	} else if ("summary" in data) {
		// It's a ReasoningData or ChatMessage with summary
		jsonData = {
			summary: data.summary,
			content: typeof data.content === "string" ? data.content : undefined,
			id: "id" in data ? data.id : undefined,
		};
	} else if ("content" in data) {
		// It's a ChatMessage without summary
		jsonData = {
			content:
				typeof data.content === "string" ? data.content : String(data.content),
			id: "id" in data ? data.id : undefined,
		};
	}

	// Get summary from data if available or use content directly
	const summary = jsonData.summary || [];
	const summaryContent = summary
		.map((item: { type: string; text: string }) => item.text)
		.join("\n");
	const content = summaryContent || jsonData.content || String(data);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="rounded-md border-yellow-500 border-l-4 bg-slate-900 p-3"
		>
			<div className="mb-1 flex items-center justify-between text-xs">
				<CollapsibleTrigger className="flex items-center gap-1 font-semibold text-yellow-400 uppercase hover:text-yellow-300">
					{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
					<span>codex reasoning</span>
				</CollapsibleTrigger>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<CollapsibleContent>
				<div className="mt-2 whitespace-pre-wrap rounded border-yellow-500 border-l bg-slate-950 p-2 pl-3 font-mono text-sm text-yellow-100">
					{content.split("\n").map((line: string, index: number) => (
						<div
							key={`${jsonData.id || "reason"}-line-${index}-${line.substring(0, 10)}`}
							className={
								line.startsWith("**") ? "font-bold text-yellow-300" : ""
							}
						>
							{line}
						</div>
					))}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
