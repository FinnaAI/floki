import type { ReactNode } from "react";

interface GridPatternProps {
	children: ReactNode;
	className?: string;
}

export default function GridPattern({
	children,
	className = "",
}: GridPatternProps) {
	return (
		<div className={`relative ${className}`}>
			<div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
			<div className="relative z-10">{children}</div>
		</div>
	);
}
