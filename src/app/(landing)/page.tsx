import { Hero } from "@/components/landing/Hero";
export const dynamic = "force-dynamic";

export default function Home() {
	return (
		<div className="flex h-full w-full flex-col">
			<main className="h-full w-full">
				{/* Hero Section */}
				<Hero />
				<div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
			</main>
		</div>
	);
}
