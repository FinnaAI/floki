"use client";

import { useIDEStore } from "@/store/ide-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AgentPathPage({
	params,
}: {
	params: { agentPath: string[] };
}) {
	const router = useRouter();
	const setCurrentAgent = useIDEStore((state) => state.setCurrentAgent);

	useEffect(() => {
		// Get the first segment of the path as the agent ID
		const agentId = params.agentPath[0];

		if (agentId) {
			// Set the agent ID in the store
			setCurrentAgent(agentId);

			// Redirect to the main IDE page
			router.push("/ide");
		}
	}, [params.agentPath, router, setCurrentAgent]);

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="mb-2 font-bold text-2xl">Loading Agent...</h1>
				<p>Redirecting to IDE with agent {params.agentPath[0]}</p>
			</div>
		</div>
	);
}
