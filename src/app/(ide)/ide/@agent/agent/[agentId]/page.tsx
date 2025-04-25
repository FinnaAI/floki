"use client";

import { useIDEStore } from "@/store/ide-store";
import { useEffect, useState } from "react";

export default function AgentPage({
	params,
}: {
	params: Promise<{ agentId: string }>;
}) {
	const setCurrentAgent = useIDEStore((state) => state.setCurrentAgent);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		async function loadParams() {
			const resolvedParams = await params;
			const { agentId } = resolvedParams;

			setCurrentAgent(agentId);
			setIsLoaded(true);
		}

		loadParams();
	}, [params, setCurrentAgent]);

	return (
		<div className="flex h-full flex-col">
			{isLoaded ? (
				<div>Agent loaded successfully</div>
			) : (
				<div>Loading agent...</div>
			)}
		</div>
	);
}
