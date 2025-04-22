"use client";

import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Terminal } from "lucide-react";
import type React from "react";

interface CommandInputProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	connected: boolean;
	placeholder?: string;
}

export function CommandInput({
	value,
	onChange,
	onKeyDown,
	connected,
	placeholder,
}: CommandInputProps) {
	return (
		<div className="group relative flex-1">
			<div className="-translate-y-1/2 absolute top-1/2 left-3 flex transform items-center">
				<div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500 shadow-md transition-all duration-200 group-focus-within:bg-emerald-600">
					<span className="font-bold font-mono text-white text-xs">$</span>
				</div>
			</div>
			<Input
				value={value}
				onChange={onChange}
				onKeyDown={onKeyDown}
				placeholder={
					placeholder || (connected ? "Type a command..." : "Connecting...")
				}
				className="h-11 w-full rounded-lg border-slate-200 bg-white pr-12 pl-12 font-mono shadow-sm transition-all duration-200 hover:border-slate-300 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
				disabled={!connected}
				autoComplete="off"
				autoCapitalize="off"
				spellCheck="false"
			/>
			{value && (
				<div className="-translate-y-1/2 absolute top-1/2 right-3 flex transform items-center space-x-1.5 rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-500 text-xs dark:bg-emerald-900/20">
					<span>Enter</span>
					<ArrowRight size={14} />
				</div>
			)}
			{!connected && (
				<div className="-translate-y-1/2 absolute top-1/2 right-3 flex transform items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 dark:bg-amber-900/20">
					<Loader2 size={14} className="animate-spin text-amber-500" />
					<span className="font-medium text-amber-500 text-xs">
						Connecting...
					</span>
				</div>
			)}
		</div>
	);
}
