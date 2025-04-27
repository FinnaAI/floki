import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const isElectron = () => {
	// Check if running in Electron renderer process
	if (typeof window !== "undefined" && typeof window.electron !== "undefined") {
		return true;
	}

	// Main process check
	if (
		typeof process !== "undefined" &&
		typeof process.versions === "object" &&
		!!process.versions.electron
	) {
		return true;
	}

	// Additional renderer check (backup)
	if (
		typeof window !== "undefined" &&
		typeof window.process === "object" &&
		window.process.type === "renderer"
	) {
		return true;
	}

	return false;
};
