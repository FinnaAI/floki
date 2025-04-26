"use client";

import dynamic from "next/dynamic";

const Tweet = dynamic(() => import("react-tweet").then((mod) => mod.Tweet), {
	ssr: false,
});

export function ClientTweet({ id }: { id: string }) {
	return <Tweet id={id} />;
}
