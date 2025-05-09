"use client";

import { Button } from "@/components/ui/button";
import { useIDEStore } from "@/store/ide-store";
import { memo } from "react";

interface ErrorStateProps {
	error: string;
	onOpenFolder: () => void;
}

export const ErrorState = memo(({ error, onOpenFolder }: ErrorStateProps) => {
	const { activeProject } = useIDEStore();

	return (
		<div className="flex items-center justify-center">
			<div className="">
				{error === "No folder selected" && !activeProject ? (
					<div className="flex flex-col items-center gap-2">
						<span>Select a folder to view files</span>
						<Button
							onClick={onOpenFolder}
							className="m-2"
							variant="outline"
							size="sm"
						>
							Open Folder
						</Button>
					</div>
				) : (
					`Error: ${error}`
				)}
			</div>
		</div>
	);
});
ErrorState.displayName = "ErrorState";
