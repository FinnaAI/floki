import * as motion from "motion/react-client";

export const SDKButton = ({
	color,
	icon,
	text,
	boldText = "AI Coder",
	className = "",
}: {
	color: "blue" | "purple" | "emerald";
	icon: React.ReactNode;
	text: string;
	boldText?: string;
	className?: string;
}) => {
	const gradients = {
		blue: "from-blue-600 to-blue-500",
		purple: "from-purple-700 to-purple-600",
		emerald: "from-emerald-600 to-emerald-500",
	};

	const shadows = {
		blue: "0 4px 12px rgba(59, 130, 246, 0.3)",
		purple: "0 4px 12px rgba(126, 34, 206, 0.3)",
		emerald: "0 4px 12px rgba(16, 185, 129, 0.3)",
	};

	return (
		<motion.button
			className={`flex h-9 items-center justify-center rounded-md bg-gradient-to-r ${gradients[color]} cursor-pointer px-4 font-medium text-white text-xs shadow-sm transition-all ${className}`}
			whileHover={{ y: -2, scale: 1.02, boxShadow: shadows[color] }}
		>
			{icon}
			<span className="mr-1">{text}</span>
			{boldText && <span className="font-bold">{boldText}</span>}
		</motion.button>
	);
};
