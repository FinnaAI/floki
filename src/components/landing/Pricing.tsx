import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";

export default function Pricing() {
	return (
		<div className="container mx-auto max-w-6xl">
			<motion.div
				className="mb-16 text-center"
				initial={{ opacity: 0, y: 20 }}
				whileInView={{ opacity: 1, y: 0 }}
				viewport={{ once: true }}
				transition={{ duration: 0.5 }}
			>
				<h2 className="mb-4 font-bold text-3xl md:text-4xl">Pricing</h2>
				<p className="mx-auto max-w-2xl text-muted-foreground text-xl">
					Simple, straightforward pricing for developers and organizations
				</p>
			</motion.div>

			<div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
				<motion.div
					className="relative rounded-xl border bg-card p-8"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.1 }}
					whileHover={{ y: -10, transition: { duration: 0.2 } }}
				>
					<div className="-translate-y-1/4 absolute top-0 right-0 h-32 w-32 translate-x-1/4 transform rounded-full bg-chart-1/5 blur-3xl" />
					<h3 className="relative z-10 mb-2 font-semibold text-xl">
						For Individuals
					</h3>
					<div className="relative z-10 mb-6">
						<span className="font-bold text-4xl">$2</span>
						<span className="text-muted-foreground">/integration</span>
					</div>
					<ul className="relative z-10 mb-8 space-y-2">
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Pay only for what you need</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Multiple AI agents per integration</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Automated PR creation</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Connect your GitHub repositories</span>
						</li>
					</ul>
					<Button className="relative z-10 w-full" variant="default">
						Get Started
					</Button>
				</motion.div>

				<motion.div
					className="relative rounded-xl border bg-card p-8"
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.2 }}
					whileHover={{ y: -10, transition: { duration: 0.2 } }}
				>
					<div className="-translate-y-1/4 absolute top-0 right-0 h-32 w-32 translate-x-1/4 transform rounded-full bg-chart-5/5 blur-3xl" />
					<h3 className="relative z-10 mb-2 font-semibold text-xl">
						For Companies
					</h3>
					<div className="relative z-10 mb-6">
						<span className="font-bold text-4xl">Custom</span>
					</div>
					<ul className="relative z-10 mb-8 space-y-2">
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Unlimited AI agents</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Private cloud deployment</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>SSO & advanced security</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>Official SDK partnership</span>
						</li>
						<li className="flex items-center gap-2">
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
								className="text-chart-1"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span>24/7 dedicated support</span>
						</li>
					</ul>
					<Button className="relative z-10 w-full" variant="secondary">
						Talk to Us
					</Button>
				</motion.div>
			</div>
		</div>
	);
}
