import React from "react";
import type { FileInfo, GitStatus } from "../types";
import { FileBreadcrumb } from "./breadcrumb";
import { GitStatusBadge } from "./git-status";
import { ThemeSelector } from "./theme-selector";

interface EditorToolbarProps {
	selectedFile: FileInfo | null;
	currentPath?: string;
	isEditing: boolean;
	onEditToggle: () => void;
	fileStatus: GitStatus;
	showDiff: boolean;
	onDiffToggle: () => void;
	currentTheme: string;
	availableThemes: string[];
	onThemeChange: (theme: string) => void;
}

export const EditorToolbar = React.memo(
	({
		selectedFile,
		currentPath = "",
		isEditing,
		onEditToggle,
		fileStatus,
		showDiff,
		onDiffToggle,
		currentTheme,
		availableThemes,
		onThemeChange,
	}: EditorToolbarProps) => {
		const isImageFile = selectedFile?.name.match(
			/\.(png|jpe?g|gif|svg|ico|webp|bmp|tiff)$/i,
		);

		return (
			<div className="flex h-9 items-center justify-between border-b px-1">
				<div className="flex items-center px-4 text-sm">
					{selectedFile ? (
						<>
							{/* Edit toggle button */}
							{selectedFile && !isImageFile && !showDiff && (
								<button
									type="button"
									onClick={onEditToggle}
									className="mr-2 rounded-md px-2 py-1 text-muted-foreground text-xs"
								>
									{isEditing ? "Save" : "Edit"}
								</button>
							)}

							{/* File path breadcrumb */}
							<FileBreadcrumb
								filePath={selectedFile.path}
								currentPath={currentPath}
							/>

							{/* Diff view toggle button */}
							{fileStatus === "modified" && !isImageFile && (
								<button
									type="button"
									onClick={onDiffToggle}
									className="ml-2 rounded-md px-2 py-1 text-blue-500 text-xs"
								>
									{showDiff ? "Hide Diff" : "Show Diff"}
								</button>
							)}
						</>
					) : (
						<span className="">No file selected</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Theme selector */}
					<ThemeSelector
						currentTheme={currentTheme}
						availableThemes={availableThemes}
						onThemeChange={onThemeChange}
					/>

					{/* Git Status Badge */}
					{selectedFile && fileStatus && (
						<div className="flex items-center">
							<GitStatusBadge status={fileStatus} />
						</div>
					)}
				</div>
			</div>
		);
	},
);

EditorToolbar.displayName = "EditorToolbar";
