"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AgentIndexPage() {
  const router = useRouter();

  // Redirect to IDE with default agent
  useEffect(() => {
    router.push("/ide");
  }, [router]);

  return null;
}
