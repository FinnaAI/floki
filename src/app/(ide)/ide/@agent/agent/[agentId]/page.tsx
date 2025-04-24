"use client";

import { useEffect, useState } from "react";
import { useIDEStore } from "@/store/ide-store";

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
    <div className="flex flex-col h-full">
      {isLoaded ? (
        <div>Agent loaded successfully</div>
      ) : (
        <div>Loading agent...</div>
      )}
    </div>
  );
}
