"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useFileStore } from "@/store/file-store";
import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
export function DirectoryPermissionPrompt() {
	const { openFolder, requestPersistentStorage } = useFileStore(useShallow(state => ({
		openFolder: state.openFolder,
		requestPersistentStorage: state.requestPersistentStorage,
	})));
	const [loading, setLoading] = useState(false);
	const [persistenceGranted, setPersistenceGranted] = useState(false);

	// Request persistent storage first, then open the folder
	const handleOpenFolder = async () => {
		setLoading(true);

		try {
			// First request persistent storage permission
			const isPersisted = await requestPersistentStorage();
			setPersistenceGranted(isPersisted);

			// Then open the folder picker
			await openFolder();
		} catch (error) {
			console.error("Error opening folder with persistent permissions:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="mx-auto mt-8 max-w-md">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FolderOpen className="h-5 w-5" />
					Directory Access
				</CardTitle>
				<CardDescription>
					Grant persistent access to your project folders
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="mb-4 text-sm">
					This app needs permission to access your project files. When you click
					the button below, the browser will ask for permission:
				</p>
				<ul className="mb-4 list-disc space-y-2 pl-5 text-sm">
					<li>
						Choose <strong>Allow on every visit</strong> to avoid having to
						re-grant permission each time you load the app.
					</li>
					<li>
						This makes your development workflow smoother and lets the app
						automatically detect file changes.
					</li>
					<li>
						You can always revoke access later through the site settings in your
						browser.
					</li>
				</ul>
				{persistenceGranted && (
					<div className="mb-4 rounded bg-green-100 p-2 text-sm dark:bg-green-950">
						<p className="text-green-800 dark:text-green-200">
							✓ Persistent storage granted! Now select your project folder.
						</p>
					</div>
				)}
			</CardContent>
			<CardFooter>
				<Button onClick={handleOpenFolder} disabled={loading}>
					{loading ? "Opening..." : "Open Project Folder"}
				</Button>
			</CardFooter>
		</Card>
	);
}
