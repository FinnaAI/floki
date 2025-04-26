import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export const isElectron = () => {
    // Renderer process
    if (typeof window !== "undefined" &&
        typeof window.process === "object" &&
        window.process.type === "renderer") {
        return true;
    }
    // Main process
    if (typeof process !== "undefined" &&
        typeof process.versions === "object" &&
        !!process.versions.electron) {
        return true;
    }
    return false;
};
