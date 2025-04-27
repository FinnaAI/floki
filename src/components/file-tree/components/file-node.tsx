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
import { memo } from "react";
import type { FileNodeProps } from "../types";
import { InlineEditor } from "./inline-editor";

export const FileNode = memo(
	({
		file,
		isSelected,
		isIgnored,
		fileStatus,
		onSelect,
		onToggleSelect,
		isChecked,
		onDelete,
		setRenameTarget,
		setDraftName,
		renameTarget,
		draftName,
	}: FileNodeProps) => {
		const statusColor =
			fileStatus === "modified"
				? "bg-amber-500"
				: fileStatus === "added" || fileStatus === "untracked"
					? "bg-green-500"
					: fileStatus === "deleted"
						? "bg-red-500"
						: "";

		const isRenaming = renameTarget === file.path;

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
							isIgnored ? "opacity-50" : "",
							fileStatus
								? `border-l-1 border-${statusColor.replace("bg-", "")}`
								: "",
						)}
						onClick={isRenaming ? undefined : onSelect}
						onKeyDown={(e) => {
							if (!isRenaming && (e.key === "Enter" || e.key === " ")) {
								onSelect();
							}
						}}
					>
						<Checkbox
							checked={isChecked}
							onCheckedChange={isRenaming ? undefined : onToggleSelect}
							onClick={(e) =>
								isRenaming ? e.preventDefault() : e.stopPropagation()
							}
							className="mr-1 h-3.5 w-3.5"
						/>
						<div className="h-auto p-0">{getFileIcon(file.name)}</div>
						{isRenaming ? (
							<div className="flex-1">
								<InlineEditor
									value={draftName}
									onChange={setDraftName}
									onConfirm={() => {
										useFileStore.getState().renameItem(file.path, draftName);
										setRenameTarget(null);
									}}
									onCancel={() => setRenameTarget(null)}
								/>
							</div>
						) : (
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
						)}
						{fileStatus && (
							<div className={cn("h-2.5 w-2.5 rounded-full", statusColor)} />
						)}
					</Button>
				</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem onClick={onSelect}>Open File</ContextMenuItem>
					<ContextMenuItem
						onClick={() => {
							setRenameTarget(file.path);
							setDraftName(file.name);
						}}
					>
						Rename
					</ContextMenuItem>
					<ContextMenuSeparator />
					<ContextMenuItem variant="destructive" onClick={onDelete}>
						Delete File
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		);
	},
);
FileNode.displayName = "FileNode";
