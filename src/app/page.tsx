import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
	return (
		<main>
			<h1>Floki</h1>
			<Link href="/ide">IDE</Link>
		</main>
	);
}
