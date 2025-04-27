"use client";

import { AutoFocusInput } from "@/components/ui/auto-focus-input";
import { cn } from "@/lib/utils";
import { memo, useEffect, useState } from "react";
import type { InlineEditorProps } from "../types";

export const InlineEditor = memo(
	({
		value,
		onChange,
		onConfirm,
		onCancel,
		className = "",
	}: InlineEditorProps) => {
		const [localValue, setLocalValue] = useState(value);

		// Sync local state with prop when value changes from parent
		useEffect(() => {
			setLocalValue(value);
		}, [value]);

		// Handle input change
		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setLocalValue(newValue);
			onChange(newValue);
		};

		return (
			<AutoFocusInput
				className={cn("h-7 px-2 py-1 text-sm", className)}
				value={localValue}
				onChange={handleChange}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						onConfirm();
					}
					if (e.key === "Escape") {
						e.preventDefault();
						onCancel();
					}
				}}
				onClick={(e) => e.stopPropagation()}
				onBlur={onCancel}
			/>
		);
	},
);
InlineEditor.displayName = "InlineEditor";
