"use client";

import { useFileStore } from "@/store/file-store";
import { useEffect } from "react";

export function FileStoreInitializer() {
	const { hasInitialized, setInitialized, loadDirectory } = useFileStore();

	// Initialize the store on mount
	useEffect(() => {
		if (!hasInitialized) {
			console.log("Initializing file store...");
			setInitialized(true);

			// Use an explicit empty string to load the root directory
			loadDirectory("")
				.then(() => {
					console.log("Initial directory loaded successfully");
				})
				.catch((err) => {
					console.error("Error loading initial directory:", err);
				});
		}
	}, [hasInitialized, setInitialized, loadDirectory]);

	// This component doesn't render anything
	return null;
}
