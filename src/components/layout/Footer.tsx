export default function Footer() {
	return (
		<footer className="relative overflow-hidden border-t py-4">
			{/* Background pattern */}
			<div className="absolute inset-0 justify-between bg-grid-pattern opacity-[0.02]" />

			<div className="relative z-10 mx-auto max-w-6xl px-4">
				<div className="flex justify-between">
					<p className="mb-4 text-muted-foreground text-sm md:mb-0">Floki AI</p>
					<p className="mb-4 text-muted-foreground text-sm md:mb-0">
						AI-First Development Environment
					</p>
				</div>
			</div>
		</footer>
	);
}
