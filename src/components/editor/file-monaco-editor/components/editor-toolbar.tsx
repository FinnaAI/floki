import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React, { useMemo } from "react";
import type { FileInfo, GitFileStatus } from "../types";
import { GitStatusBadge } from "./git-status";
import { ThemeSelector } from "./theme-selector";

interface EditorToolbarProps {
	selectedFile: FileInfo;
	currentPath?: string;
	isEditing: boolean;
	onEditToggle: () => void;
	fileStatus: GitFileStatus;
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
		// Parse file path for breadcrumb
		const pathParts = useMemo(() => {
			if (!selectedFile?.path) return [];

			// Remove currentPath prefix if present
			let displayPath = selectedFile.path;
			if (currentPath && displayPath.startsWith(currentPath)) {
				displayPath = displayPath.slice(currentPath.length);
				// Remove leading slash if present
				if (displayPath.startsWith("/")) {
					displayPath = displayPath.slice(1);
				}
			}

			return displayPath.split("/").filter(Boolean);
		}, [selectedFile?.path, currentPath]);

		return (
			<div className="flex h-9 items-center justify-between border-b px-1">
				<div className="flex items-center px-4 text-sm">
					{/* Edit toggle button */}
					<button
						type="button"
						onClick={onEditToggle}
						className="mr-2 rounded-md px-2 py-1 text-muted-foreground text-xs"
					>
						{isEditing ? "Save" : "Edit"}
					</button>

					{/* File path breadcrumb */}
					<Breadcrumb className="flex-1 overflow-hidden">
						<BreadcrumbList className="flex-wrap">
							{pathParts.map((part, index) => {
								const isLast = index === pathParts.length - 1;
								// Create a compound key using the part and its path up to this point
								const keyPath = pathParts.slice(0, index + 1).join("/");
								return (
									<React.Fragment key={keyPath}>
										{index > 0 && <BreadcrumbSeparator />}
										<BreadcrumbItem>
											{isLast ? (
												<BreadcrumbPage className="truncate font-medium">
													{part}
												</BreadcrumbPage>
											) : (
												<BreadcrumbLink className="truncate">
													{part}
												</BreadcrumbLink>
											)}
										</BreadcrumbItem>
									</React.Fragment>
								);
							})}
						</BreadcrumbList>
					</Breadcrumb>

					{/* Diff view toggle button */}
					{fileStatus === "modified" && (
						<button
							type="button"
							onClick={onDiffToggle}
							className="ml-2 rounded-md px-2 py-1 text-blue-500 text-xs"
						>
							{showDiff ? "Hide Diff" : "Show Diff"}
						</button>
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
					{fileStatus && (
						<GitStatusBadge status={fileStatus} />
					)}
				</div>
			</div>
		);
	},
);

EditorToolbar.displayName = "EditorToolbar";
