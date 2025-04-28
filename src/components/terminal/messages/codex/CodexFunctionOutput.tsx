"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../Codex";

interface FunctionOutputData {
	call_id: string;
	output: string | Record<string, unknown>;
	metadata?: {
		exit_code?: number;
		duration_seconds?: number;
	};
}

interface CodexFunctionOutputProps {
	data: FunctionOutputData | string | ChatMessage | Record<string, unknown>;
	dateTime: string;
}

export function CodexFunctionOutput({
	data,
	dateTime,
}: CodexFunctionOutputProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Parse data based on type
	let jsonData: Partial<FunctionOutputData>;

	if (typeof data === "string") {
		try {
			jsonData = JSON.parse(data);
		} catch (e) {
			// Fallback for strings
			jsonData = { call_id: "unknown", output: data };
		}
	} else if ("function_data" in data && data.function_data) {
		// It's a ChatMessage with function_data
		const funcData = data.function_data as {
			call_id?: string;
			output?: string | Record<string, unknown>;
			metadata?: {
				exit_code?: number;
				duration_seconds?: number;
			};
		};
		
		jsonData = {
			call_id: funcData.call_id || "unknown",
			output: funcData.output || "",
			metadata: funcData.metadata,
		};
	} else if ("call_id" in data) {
		// It's already a FunctionOutputData
		jsonData = data;
	} else {
		// Fallback for other object types
		jsonData = { call_id: "unknown", output: JSON.stringify(data) };
	}

	// Extract data from the JSON
	const { call_id, output, metadata = {} } = jsonData;

	// Format output to handle deep nesting
	const formatOutput = (output: unknown): string => {
		if (output === undefined || output === null) {
			return "";
		}

		if (typeof output === "string") {
			return output;
		}

		if (typeof output === "object" && "output" in output && output.output) {
			return formatOutput(output.output);
		}

		return JSON.stringify(output, null, 2);
	};

	const formattedOutput = formatOutput(output);

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="rounded-md border-indigo-500 border-l-4 bg-slate-800 p-3"
		>
			<div className="mb-1 flex items-center justify-between text-xs">
				<CollapsibleTrigger className="flex items-center gap-1 font-semibold text-indigo-400 uppercase hover:text-indigo-300">
					{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
					<span>function output</span>
				</CollapsibleTrigger>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<CollapsibleContent>
				<div className="mt-2 font-mono text-sm">
					<div className="flex space-x-2">
						<span className="text-indigo-300">Call ID:</span>
						<span className="text-white">{call_id}</span>
					</div>

					{metadata?.exit_code !== undefined && (
						<div className="flex space-x-2">
							<span className="text-indigo-300">Exit code:</span>
							<span
								className={
									metadata.exit_code === 0 ? "text-green-400" : "text-red-400"
								}
							>
								{metadata.exit_code}
							</span>
						</div>
					)}

					{metadata?.duration_seconds !== undefined && (
						<div className="flex space-x-2">
							<span className="text-indigo-300">Duration:</span>
							<span className="text-white">{metadata.duration_seconds}s</span>
						</div>
					)}

					{formattedOutput && (
						<div className="mt-2">
							<span className="text-indigo-300">Output:</span>
							<div className="mt-1 max-h-80 overflow-x-auto overflow-y-auto whitespace-pre-wrap rounded bg-slate-900 p-2 text-gray-300">
								{formattedOutput}
							</div>
						</div>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
