"use client";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../Codex";

interface FunctionCallData {
	id: string;
	type: string;
	status: string;
	name: string;
	arguments: string | Record<string, unknown>;
}

interface ParsedArgs {
	command?: string | string[];
	[key: string]: unknown;
}

interface CodexFunctionCallProps {
	data: FunctionCallData | string | ChatMessage | Record<string, unknown>;
	dateTime: string;
}

export function CodexFunctionCall({ data, dateTime }: CodexFunctionCallProps) {
	const [isOpen, setIsOpen] = useState(false);

	// Parse data based on type
	let jsonData: FunctionCallData & {
		id: string;
		name: string;
		status: string;
		type: string;
	};

	if (typeof data === "string") {
		try {
			jsonData = JSON.parse(data);
		} catch (e) {
			// Fallback for unparseable strings
			jsonData = {
				id: "unknown",
				name: "unknown",
				status: "unknown",
				type: "unknown",
				arguments: data,
			};
		}
	} else if ("function_data" in data && data.function_data) {
		// It's a ChatMessage with function_data
		const funcData = data.function_data as {
			name?: string;
			arguments?: string | Record<string, unknown>;
		};
		
		jsonData = {
			id: (data as ChatMessage).id || "unknown",
			name: funcData.name || "unknown",
			status: (data as ChatMessage).status || "unknown",
			type: (data as ChatMessage).type || "unknown",
			arguments: funcData.arguments || {},
		};
	} else if (
		"id" in data &&
		"name" in data &&
		"status" in data &&
		"type" in data
	) {
		// It's already a FunctionCallData
		jsonData = data as FunctionCallData & {
			id: string;
			name: string;
			status: string;
			type: string;
		};
	} else {
		// Fallback for other object types
		jsonData = {
			id: "unknown",
			name: "unknown",
			status: "unknown",
			type: "unknown",
			arguments: typeof data === "string" ? data : JSON.stringify(data),
		};
	}

	const { id, name, status, arguments: args } = jsonData;

	// Try to parse the arguments if it's a string
	let parsedArgs: ParsedArgs = {};
	try {
		if (typeof args === "string") {
			parsedArgs = JSON.parse(args);
		} else if (args && typeof args === "object") {
			parsedArgs = args as ParsedArgs;
		}
	} catch (e) {
		// Use unparsed args if parsing fails
	}

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			className="rounded-md border-purple-500 border-l-4 p-3"
		>
			<div className="mb-1 flex items-center justify-between text-xs">
				<CollapsibleTrigger className="flex items-center gap-1 font-semibold text-purple-400 uppercase hover:text-purple-300">
					{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
					<span>function call</span>
				</CollapsibleTrigger>
				<span className="text-gray-400">{dateTime}</span>
			</div>
			<CollapsibleContent>
				<div className="mt-2 font-mono text-sm">
					<div className="flex space-x-2">
						<span className="text-purple-300">ID:</span>
						<span className="text-white">{id}</span>
					</div>
					{name && (
						<div className="flex space-x-2">
							<span className="text-purple-300">Name:</span>
							<span className="text-white">{name}</span>
						</div>
					)}
					<div className="flex space-x-2">
						<span className="text-purple-300">Status:</span>
						<span className="text-white">{status}</span>
					</div>
					{parsedArgs?.command && (
						<div className="mt-1">
							<span className="text-purple-300">Command:</span>
							<div className="mt-1 whitespace-pre-wrap rounded bg-slate-900 p-2 text-green-300">
								{Array.isArray(parsedArgs.command)
									? parsedArgs.command.join(" ")
									: parsedArgs.command}
							</div>
						</div>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
