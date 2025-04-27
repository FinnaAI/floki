"use client";
import { Codex } from "@/components/terminal/Codex";

export default function Agent() {
	return (
		<div className="flex h-full flex-col overflow-hidden">
			{/* <Composer /> */}
			<Codex />
		</div>
	);
}
