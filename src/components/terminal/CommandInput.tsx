"use client";

import { Command } from "lucide-react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Input } from "../ui/input";

interface CommandInputProps {
	value: string;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
	onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
	connected: boolean;
	placeholder?: string;
}

export function CommandInput({
	value,
	onChange,
	onKeyDown,
	connected,
	placeholder = "Enter a command...",
}: CommandInputProps) {
	return (
		<div className="relative flex-1">
			<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
				<Command size={16} className="text-muted-foreground" />
			</div>
			<Input
				type="text"
				value={value}
				onChange={onChange}
				onKeyDown={onKeyDown}
				disabled={!connected}
				placeholder={connected ? placeholder : "Disconnected..."}
				className="w-full pl-9"
			/>
		</div>
	);
}
