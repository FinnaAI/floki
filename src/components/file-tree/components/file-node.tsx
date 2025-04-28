"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { getFileIcon } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/file-store";
import { selectFileTreeHandlers, useFileTreeStore } from "@/store/file-tree-store";
import type { FileInfo } from "@/types/files";
import { memo } from "react";
import { useShallow } from "zustand/react/shallow";

interface FileNodeProps {
	file: FileInfo;
	isSelected?: boolean;
	fileStatus?: string;
	isIgnored?: boolean;
	isChecked?: boolean;
	onSelect?: () => void;
	onToggleSelect?: () => void;
	onDelete?: () => void;
	setRenameTarget?: (path: string | null) => void;
	setDraftName?: (name: string) => void;
	renameTarget?: string | null;
	draftName?: string;
}

export const FileNode = memo<FileNodeProps>(
	({ file, isSelected, fileStatus }) => {
		const handlers = useFileTreeStore(useShallow(selectFileTreeHandlers));
		const isChecked = useFileStore((state) => state.isFileSelected(file));

		return (
			<ContextMenu>
				<ContextMenuTrigger>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"group flex w-full items-center gap-1 rounded-md px-2 py-1.5",
							isSelected
								? "hover:!bg-neutral-700/50 bg-neutral-700/60"
								: "hover:!bg-neutral-700/50",
							fileStatus && fileStatus === "modified"
								? "border-amber-500 border-l-1"
								: fileStatus === "added" || fileStatus === "untracked"
									? "border-green-500 border-l-1"
									: fileStatus === "deleted"
										? "border-red-500 border-l-1"
										: "",
						)}
						onClick={() => handlers.handleFileClick(file)}
					>
						<Checkbox
							checked={isChecked}
							onCheckedChange={() => handlers.handleToggleSelect(file)}
							onClick={(e) => e.stopPropagation()}
							className="mr-1 h-3.5 w-3.5"
						/>
						<div className="h-auto p-0">{getFileIcon(file.name)}</div>
						<span className="flex-1 truncate pl-1 text-left text-sm">
							{file.name}
							{fileStatus && (
								<span
									className={`ml-1 text-xs ${fileStatus === "modified" ? "text-amber-500" : fileStatus === "added" || fileStatus === "untracked" ? "text-green-500" : fileStatus === "deleted" ? "text-red-500" : ""}`}
								>
									({fileStatus})
								</span>
							)}
						</span>
						{fileStatus && (
							<div
								className={cn(
									"h-2.5 w-2.5 rounded-full",
									fileStatus === "modified"
										? "bg-amber-500"
										: fileStatus === "added" || fileStatus === "untracked"
											? "bg-green-500"
											: fileStatus === "deleted"
												? "bg-red-500"
												: "",
								)}
							/>
						)}
					</Button>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={() => handlers.handleFileClick(file)}>
						Open File
					</ContextMenuItem>
					<ContextMenuItem
						onClick={() => handlers.handleRename(file.path, file.name)}
					>
						Rename
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem
						variant="destructive"
						onClick={() => handlers.handleDelete(file.path)}
					>
						Delete File
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	},
	(prev, next) => {
		return (
			prev.file.path === next.file.path &&
			prev.isSelected === next.isSelected &&
			prev.fileStatus === next.fileStatus
		);
	},
);
FileNode.displayName = "FileNode";
