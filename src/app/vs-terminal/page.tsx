"use client";

import { VsTerminal } from "@/components/terminal/VsTerminal";

export default function VsTerminalPage() {
	return (
		<div className="container mx-auto h-screen p-4">
			<div className="h-[calc(100vh-8rem)]">
				<VsTerminal />
			</div>
		</div>
	);
}
