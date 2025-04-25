"use client";
import { Codex } from "@/components/terminal/Codex";
import { useIDEStore } from "@/store/ide-store";

export default function Agent() {
	const currentAgent = useIDEStore((state) => state.currentAgent);

	return (
		<div className="flex h-full flex-col">
			<Codex />
		</div>
	);
}
