import * as motion from "motion/react-client";

export default function Features() {
	return (
		<div className="container mx-auto max-w-6xl">
			<motion.div
				className="mb-16 text-center"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="mb-4 font-bold text-3xl md:text-4xl">
					Intelligent SDK Integration Platform
				</h2>
				<p className="mx-auto max-w-2xl text-muted-foreground text-xl">
					Simplify and accelerate your integration workflow with AI-powered
					automation
				</p>
			</motion.div>

			<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
				<motion.div
					className="relative rounded-xl border bg-card p-6"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					whileHover={{ y: -5, transition: { duration: 0.2 } }}
				>
					<div className="-translate-y-1/4 absolute top-0 right-0 h-32 w-32 translate-x-1/4 transform rounded-full bg-chart-1/5 blur-3xl" />
					<div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34" />
							<path d="M14 3v4a2 2 0 0 0 2 2h4" />
							<path d="M8 16H3" />
							<path d="M10 20v-4a2 2 0 0 1 2-2h4.05a2 2 0 0 1 1.79 1.1l.47.9" />
							<path d="M18 14v4h-4" />
							<path d="M15 18.1a14 14 0 0 0 4.9 0" />
						</svg>
					</div>
					<h3 className="relative z-10 mb-3 font-semibold text-xl">
						GitHub Integration
					</h3>
					<p className="relative z-10 text-muted-foreground">
						Connect your GitHub repositories and let AI analyze your codebase to
						implement SDK integrations automatically.
					</p>
				</motion.div>

				<motion.div
					className="relative rounded-xl border bg-card p-6"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.1 }}
					whileHover={{ y: -5, transition: { duration: 0.2 } }}
				>
					<div className="-translate-y-1/4 absolute top-0 right-0 h-32 w-32 translate-x-1/4 transform rounded-full bg-chart-3/5 blur-3xl" />
					<div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="3" />
							<path d="M8 12H2" />
							<path d="M14 12h8" />
							<path d="M10 9v3" />
							<path d="M10 15v3" />
						</svg>
					</div>
					<h3 className="relative z-10 mb-3 font-semibold text-xl">
						Multiple SDKs
					</h3>
					<p className="relative z-10 text-muted-foreground">
						Integrate popular SDKs like Stripe, PostHog, Auth0, and Sentry with
						best practices and proper error handling.
					</p>
				</motion.div>

				<motion.div
					className="relative rounded-xl border bg-card p-6"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.2 }}
					whileHover={{ y: -5, transition: { duration: 0.2 } }}
				>
					<div className="-translate-y-1/4 absolute top-0 right-0 h-32 w-32 translate-x-1/4 transform rounded-full bg-chart-5/5 blur-3xl" />
					<div className="relative z-10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					</div>
					<h3 className="relative z-10 mb-3 font-semibold text-xl">
						Automated PRs
					</h3>
					<p className="relative z-10 text-muted-foreground">
						Get pull requests with clean, well-documented code changes
						automatically created for your review.
					</p>
				</motion.div>
			</div>

			<div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-2">
				<motion.div
					className="flex flex-col justify-center"
					initial={{ opacity: 0, x: -30 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<h3 className="mb-6 font-bold text-2xl">Supported Platforms</h3>
					<div className="space-y-6">
						<motion.div
							className="flex items-center gap-3"
							whileHover={{ x: 5, transition: { duration: 0.2 } }}
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M6.5 15.5v-8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1Z" />
									<path d="M13.5 15.5v-8a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1Z" />
								</svg>
							</div>
							<div>
								<h4 className="font-medium">Next.js (React)</h4>
								<p className="text-muted-foreground text-sm">
									Full support for modern Next.js applications
								</p>
							</div>
						</motion.div>

						<motion.div
							className="flex items-center gap-3"
							whileHover={{ x: 5, transition: { duration: 0.2 } }}
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M12 2v3" />
									<path d="M19.07 5.93c-1.41-1.41-3.24-2.32-5.28-2.52" />
									<path d="m8.27 20.14-1.42-3.39" />
									<path d="M2.7 13.17c.14 2.52 1.35 4.82 3.25 6.33" />
									<path d="M13.08 20.81c2.87-.44 5.24-2.3 6.25-4.97" />
									<path d="M16.76 10.22c-.15 1.87-1.37 3.47-3.1 4.33" />
									<path d="M8.19 14.23a3.92 3.92 0 0 1-1.13-3.95" />
								</svg>
							</div>
							<div>
								<h4 className="font-medium">Python (FastAPI, Django, Flask)</h4>
								<p className="text-muted-foreground text-sm">
									Backend support for popular Python frameworks
								</p>
							</div>
						</motion.div>

						<motion.div
							className="flex items-center gap-3"
							whileHover={{ x: 5, transition: { duration: 0.2 } }}
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-card">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<path d="M20.5 10a2.5 2.5 0 0 1-2.4-3H18a2.95 2.95 0 0 1-2.6-4.4 10 10 0 1 0 6.3 7.1c-.3.2-.8.3-1.2.3" />
								</svg>
							</div>
							<div>
								<h4 className="font-medium text-muted-foreground">
									Node.js (Coming Soon)
								</h4>
								<p className="text-muted-foreground text-sm">
									Express, NestJS support in development
								</p>
							</div>
						</motion.div>
					</div>
				</motion.div>

				<motion.div
					className="flex flex-col justify-center"
					initial={{ opacity: 0, x: 30 }}
					whileInView={{ opacity: 1, x: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<h3 className="mb-6 font-bold text-2xl">Supported SDKs</h3>
					<div className="grid grid-cols-2 gap-4">
						<motion.div
							className="rounded-lg border bg-card p-4"
							whileHover={{ y: -5, transition: { duration: 0.2 } }}
						>
							<div className="mb-1 font-semibold">Stripe</div>
							<p className="text-muted-foreground text-sm">
								Payment processing
							</p>
						</motion.div>
						<motion.div
							className="rounded-lg border bg-card p-4"
							whileHover={{ y: -5, transition: { duration: 0.2 } }}
						>
							<div className="mb-1 font-semibold">PostHog</div>
							<p className="text-muted-foreground text-sm">
								Analytics tracking
							</p>
						</motion.div>
						<motion.div
							className="rounded-lg border bg-card p-4"
							whileHover={{ y: -5, transition: { duration: 0.2 } }}
						>
							<div className="mb-1 font-semibold">Auth0</div>
							<p className="text-muted-foreground text-sm">Authentication</p>
						</motion.div>
						<motion.div
							className="rounded-lg border bg-card p-4"
							whileHover={{ y: -5, transition: { duration: 0.2 } }}
						>
							<div className="mb-1 font-semibold">Sentry</div>
							<p className="text-muted-foreground text-sm">Error monitoring</p>
						</motion.div>
					</div>
					<p className="mt-4 text-muted-foreground text-sm">
						More SDKs coming soon: Twilio, Firebase, AWS SDK
					</p>
				</motion.div>
			</div>
		</div>
	);
}
