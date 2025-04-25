import * as motion from "motion/react-client";

export function AppAnimation({ className }: { className?: string }) {
	return (
		<motion.div
			className={`relative hidden h-[450px] md:flex md:flex-1 ${className}`}
			initial={{ opacity: 0, x: 50 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.7, delay: 0.3 }}
		>
			{/* Center platform - Floki */}
			<motion.div
				className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-20 flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/30 bg-card shadow-xl"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.5, duration: 0.5 }}
			>
				<div className="text-center">
					<div className="font-bold text-chart-1 text-xl">Floki</div>
					<div className="text-muted-foreground text-xs">AI-First Dev</div>
				</div>
			</motion.div>

			{/* Floating 3D cards for features */}
			{/* BYOM - Bring Your Own Model */}
			<motion.div
				className="absolute top-[5%] left-[5%] z-10"
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.7, duration: 0.5 }}
				whileHover={{ y: -5, scale: 1.05, transition: { duration: 0.2 } }}
			>
				<div className="w-52 rounded-lg border bg-card p-4 shadow-lg">
					<div className="mb-2 flex items-center gap-2">
						<div className="rounded-md bg-blue-500/20 p-2 text-blue-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								role="img"
							>
								<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
								<path d="M3 3v5h5" />
								<path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
								<path d="M16 16h5v5" />
							</svg>
						</div>
						<div className="font-semibold">BYOM/BYOA</div>
					</div>
					<p className="text-muted-foreground text-xs">
						Connect to your preferred AI models and agents seamlessly
					</p>
				</div>
			</motion.div>

			{/* Prompt Templates */}
			<motion.div
				className="absolute top-[20%] left-[65%] z-10"
				initial={{ y: -20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 0.9, duration: 0.5 }}
				whileHover={{ y: -5, scale: 1.05, transition: { duration: 0.2 } }}
			>
				<div className="w-52 rounded-lg border bg-card p-4 shadow-lg">
					<div className="mb-2 flex items-center gap-2">
						<div className="rounded-md bg-purple-500/20 p-2 text-purple-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								role="img"
							>
								<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
							</svg>
						</div>
						<div className="font-semibold">Prompt Templates</div>
					</div>
					<p className="text-muted-foreground text-xs">
						Access and customize proven prompt templates for development
					</p>
				</div>
			</motion.div>

			{/* PRD Generator */}
			<motion.div
				className="-left-[5%] absolute bottom-[20%] z-10"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 1.1, duration: 0.5 }}
				whileHover={{ y: -5, scale: 1.05, transition: { duration: 0.2 } }}
			>
				<div className="w-52 rounded-lg border bg-card p-4 shadow-lg">
					<div className="mb-2 flex items-center gap-2">
						<div className="rounded-md bg-emerald-500/20 p-2 text-emerald-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								role="img"
							>
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
								<line x1="3" y1="9" x2="21" y2="9" />
								<line x1="9" y1="21" x2="9" y2="9" />
							</svg>
						</div>
						<div className="font-semibold">PRD Generator</div>
					</div>
					<p className="text-muted-foreground text-xs">
						Create detailed product requirement docs from simple ideas
					</p>
				</div>
			</motion.div>

			{/* IDE Integration */}
			<motion.div
				className="absolute bottom-[5%] left-[55%] z-10"
				initial={{ y: 20, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ delay: 1.3, duration: 0.5 }}
				whileHover={{ y: -5, scale: 1.05, transition: { duration: 0.2 } }}
			>
				<div className="w-52 rounded-lg border bg-card p-4 shadow-lg">
					<div className="mb-2 flex items-center gap-2">
						<div className="rounded-md bg-amber-500/20 p-2 text-amber-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
								role="img"
							>
								<polyline points="16 18 22 12 16 6" />
								<polyline points="8 6 2 12 8 18" />
							</svg>
						</div>
						<div className="font-semibold">IDE Integration</div>
					</div>
					<p className="text-muted-foreground text-xs">
						Seamless integration with VSCode and other environments
					</p>
				</div>
			</motion.div>

			{/* Subtle animated connector nodes */}
			<motion.div
				className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-52 w-52 rounded-full border border-primary/20 border-dashed"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 0.7 }}
				transition={{ delay: 0.6, duration: 0.5 }}
			/>

			<motion.div
				className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-72 w-72 rounded-full border border-primary/10 border-dashed"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 0.7 }}
				transition={{ delay: 0.7, duration: 0.5 }}
			/>

			<motion.div
				className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 h-96 w-96 rounded-full border border-primary/5 border-dashed"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 0.7 }}
				transition={{ delay: 0.8, duration: 0.5 }}
			/>

			{/* Floating dots circling around */}
			{/* {Array.from({ length: 12 }).map((_, i) => {
        // Calculate position on a circle
        const angle = (i / 12) * Math.PI * 2; // Distribute evenly in a circle
        const radius = 160; // Distance from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <motion.div
            key={`dot-${i}`}
            className="absolute rounded-full bg-primary/40 w-2 h-2"
            initial={{
              opacity: 0,
              x: x / 2,
              y: y / 2,
            }}
            animate={{
              opacity: 0.6 + Math.random() * 0.4,
              x: x,
              y: y,
            }}
            transition={{
              delay: 1 + i * 0.05,
              duration: 0.5,
            }}
            style={{
              left: "calc(50% - 1px)",
              top: "calc(50% - 1px)",
            }}
          />
        );
      })} */}

			{/* Additional orbiting dots with animation */}
			{/* {Array.from({ length: 6 }).map((_, i) => {
        const speed = 20 + i * 5; // Different speeds
        const radius = 180 + i * 10; // Different orbit distances
        const initialAngle = (i / 6) * Math.PI * 2;

        return (
          <motion.div
            key={`orbit-${i}`}
            className="absolute rounded-full bg-chart-1/30 w-2.5 h-2.5"
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 0.7,
              rotate: 360,
            }}
            transition={{
              rotate: {
                duration: speed,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              },
              opacity: {
                delay: 1.5 + i * 0.1,
                duration: 0.5,
              },
            }}
            style={{
              left: "calc(50% - 1.25px)",
              top: "calc(50% - 1.25px)",
              transformOrigin: `1.25px calc(${radius}px + 1.25px)`,
            }}
          />
        );
      })} */}
		</motion.div>
	);
}
