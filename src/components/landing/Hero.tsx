import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@radix-ui/react-tooltip";
import * as motion from "motion/react-client";
import Image from "next/image";
import Link from "next/link";
import { ClientTweet } from "./client-tweet";

export function Hero() {
	const codingAgents = [
		{
			name: "Codex",
			logoUrl: "https://www.svgrepo.com/show/306500/openai.svg",
			url: "https://github.com/openai/codex",
		},
		{
			name: "Claude",
			logoUrl: "https://logo.clearbit.com/anthropic.com",
			url: "https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview",
		},
		{
			name: "Codebuff",
			note: "Coming Soon",
			logoUrl: "https://logo.clearbit.com/codebuff.com",
			url: "https://codebuff.com",
		},
	];

	return (
		<section className="relative flex h-full w-full items-center">
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/10">
				<div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
			</div>

			{/* Animated gradients */}
			<motion.div
				className="absolute top-20 right-1/3 h-80 w-80 rounded-full bg-chart-1/20 blur-3xl"
				animate={{
					x: [30, -30, 30],
					y: [-30, 30, -30],
					scale: [1, 1.1, 1],
				}}
				transition={{
					duration: 15,
					repeat: Number.POSITIVE_INFINITY,
					repeatType: "reverse",
				}}
			/>

			<motion.div
				className="absolute bottom-40 left-1/3 h-80 w-80 rounded-full bg-chart-3/20 blur-3xl"
				animate={{
					x: [-30, 30, -30],
					y: [30, -30, 30],
					scale: [1, 1.2, 1],
				}}
				transition={{
					duration: 20,
					repeat: Number.POSITIVE_INFINITY,
					repeatType: "reverse",
				}}
			/>

			{/* Content */}
			<div className="z-10 mx-auto px-4 py-36">
				<div className="mx-auto max-w-4xl space-y-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-12 py-12 text-center"
					>
						<h1 className="mb-6 font-bold text-5xl md:text-6xl">
							<span className="block text-orange-500">Floki</span> AI-First
							Development Environment
						</h1>

						<p className="mb-8 text-muted-foreground text-xl md:text-2xl">
							Build better software, faster with AI-powered assistance
						</p>

						<div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Link
									href="/ide"
									className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground sm:w-auto"
								>
									Try Now
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>Arrow right</title>
										<path d="M5 12h14" />
										<path d="m12 5 7 7-7 7" />
									</svg>
								</Link>
							</motion.div>

							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Link
									href="https://github.com/finnaai/floki"
									className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-accent-foreground sm:w-auto"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<title>GitHub</title>
										<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
										<path d="M9 18c-4.51 2-5-2-7-2" />
									</svg>
									GitHub
								</Link>
							</motion.div>
						</div>

						<div>
							<p className="mb-4 text-muted-foreground text-sm">
								Powered by leading AI models:
							</p>
							<div className="flex flex-wrap justify-center gap-6">
								{codingAgents.map((agent) => (
									<div key={agent.name} className="flex items-center">
										{agent.note ? (
											<TooltipProvider>
												<Tooltip>
													<TooltipTrigger asChild>
														<div className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2">
															<Image
																src={agent.logoUrl}
																alt={agent.name}
																className="size-5 rounded-md"
																width={20}
																height={20}
															/>
															{agent.name} *
														</div>
													</TooltipTrigger>
													<TooltipContent className="rounded-md bg-popover p-2 text-popover-foreground text-sm">
														{agent.note}
													</TooltipContent>
												</Tooltip>
											</TooltipProvider>
										) : (
											<div className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2">
												<Image
													src={agent.logoUrl}
													alt={agent.name}
													className="size-5 rounded-md"
													width={20}
													height={20}
												/>
												{agent.name}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</motion.div>

					<div className="flex w-full justify-center">
						<ClientTweet id="1914701646099021969" />
					</div>
				</div>
			</div>
		</section>
	);
}
