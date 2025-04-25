"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AgentIndexPage() {
	const router = useRouter();

	// Redirect to IDE with default agent
	useEffect(() => {
		router.push("/ide");
	}, [router]);

	return null;
}
