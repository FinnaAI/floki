"use client";

import { Button } from "@/components/ui/button";
import { useGitStatusStore } from "@/store/git-status-store";
import { Eye, EyeOff, GitCompare } from "lucide-react";
import React, { useEffect } from "react";

// Keeping the type for backward compatibility
interface GitStatus {
	modified: string[];
	added: string[];
	untracked: string[];
	deleted: string[];
	ignored: string[];
	error?: string;
}

// Legacy provider that uses the store internally - for backwards compatibility
export const GitStatusProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { showGitStatus, fetchGitStatus, setCurrentPath, currentPath } =
		useGitStatusStore();

	// Fetch git status when showGitStatus changes
	useEffect(() => {
		if (showGitStatus) {
			fetchGitStatus();
		}
	}, [showGitStatus, fetchGitStatus]);

	return <>{children}</>;
};

// Backward compatibility context - uses the store internally
export const GitStatusContext = React.createContext<{
	showGitStatus: boolean;
	gitStatus: GitStatus | null;
	showIgnoredFiles: boolean;
	toggleGitStatus: () => void;
	toggleIgnoredFiles: () => void;
	getFileStatus: (filePath: string) => string;
	isIgnored: (filePath: string) => boolean;
	setCurrentPath: (path: string) => void;
}>({
	showGitStatus: true,
	gitStatus: null,
	showIgnoredFiles: false,
	toggleGitStatus: () => {},
	toggleIgnoredFiles: () => {},
	getFileStatus: () => "",
	isIgnored: () => false,
	setCurrentPath: () => {},
});

// Hook that uses the store - for backward compatibility
export const useGitStatus = () => {
	const store = useGitStatusStore();
	return store;
};

// Git status UI component - now using the store directly
export const GitStatusBar: React.FC = () => {
	const {
		showGitStatus,
		gitStatus,
		showIgnoredFiles,
		toggleGitStatus,
		toggleIgnoredFiles,
	} = useGitStatusStore();

	return (
		<div className="flex items-center space-x-2 px-2">
			<Button
				variant={showGitStatus ? "default" : "outline"}
				size="sm"
				onClick={toggleGitStatus}
				className="h-8 rounded-full px-3"
				title="Toggle Git status"
			>
				<GitCompare size={16} className="mr-1" />
				<span>Git</span>
			</Button>

			{showGitStatus && (
				<Button
					variant={showIgnoredFiles ? "default" : "outline"}
					size="sm"
					onClick={toggleIgnoredFiles}
					className="h-8 rounded-full px-3"
					title="Toggle showing ignored files"
				>
					{showIgnoredFiles ? (
						<EyeOff size={16} className="mr-1" />
					) : (
						<Eye size={16} className="mr-1" />
					)}
					<span>Ignored</span>
				</Button>
			)}

			{/* Status indicators */}
			{showGitStatus && gitStatus && (
				<div className="flex space-x-3 text-xs">
					{gitStatus.modified.length > 0 && (
						<span className="text-amber-500 dark:text-amber-400">
							{gitStatus.modified.length} modified
						</span>
					)}
					{gitStatus.added.length > 0 && (
						<span className="text-green-500 dark:text-green-400">
							{gitStatus.added.length} added
						</span>
					)}
					{gitStatus.deleted.length > 0 && (
						<span className="text-red-500 dark:text-red-400">
							{gitStatus.deleted.length} deleted
						</span>
					)}
					{gitStatus.untracked.length > 0 && (
						<span className="text-blue-500 dark:text-blue-400">
							{gitStatus.untracked.length} untracked
						</span>
					)}
					{gitStatus.ignored && gitStatus.ignored.length > 0 && (
						<span className="text-slate-500 dark:text-slate-400">
							{showIgnoredFiles ? gitStatus.ignored.length : "?"} ignored
						</span>
					)}
				</div>
			)}
		</div>
	);
};
