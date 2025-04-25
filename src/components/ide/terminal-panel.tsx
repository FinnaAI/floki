"use client";

import { VsTerminal } from "@/components/terminal/VsTerminal";
import type React from "react";
import { useEffect, useRef } from "react";

interface TerminalPanelProps {
	className?: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ className }) => {
	const terminalRef = useRef<HTMLDivElement>(null);
	const hasInitialized = useRef(false);

	// Auto-connect when terminal is first rendered
	useEffect(() => {
		if (!hasInitialized.current && terminalRef.current) {
			hasInitialized.current = true;
			// The VsTerminal should have an auto-connect behavior
			// If it doesn't, implement additional connection logic here
		}
	}, []);

	return (
		<div className={`flex h-full flex-col ${className || ""}`}>
			<div className="flex-1 overflow-hidden" ref={terminalRef}>
				<VsTerminal autoConnect={true} />
			</div>
		</div>
	);
};
