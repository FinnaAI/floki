"use client";

import { useFileTreeStore } from "@/store/file-tree-store";

export function StatusBar() {
	const { filteredFiles, searchQuery } = useFileTreeStore();

	return (
		<div className="border-slate-200 border-t bg-slate-100 px-4 py-1 text-slate-500 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
			{filteredFiles.length} items
			{searchQuery && " (filtered)"}
		</div>
	);
} 