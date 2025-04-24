"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIDEStore } from "@/store/ide-store";

export default function AgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const router = useRouter();
  const setCurrentAgent = useIDEStore((state) => state.setCurrentAgent);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;
      const { agentId } = resolvedParams;

      setCurrentAgent(agentId);
      router.push("/ide");
      setIsLoaded(true);
    }

    loadParams();
  }, [params, router, setCurrentAgent]);

  return null;
}
