import { Badge } from "@/components/ui/badge";
import React from "react";
import type { GitFileStatus } from "../types";

interface GitStatusBadgeProps {
	status: GitFileStatus;
}

export const GitStatusBadge = React.memo(({ status }: GitStatusBadgeProps) => {
	if (!status) return null;

	const statusStyles = {
		modified:
			"border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
		added:
			"border-green-200 bg-green-100 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300",
		deleted:
			"border-red-200 bg-red-100 text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
		untracked:
			"border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
	};

	const statusLabels = {
		modified: "Modified",
		added: "Added",
		deleted: "Deleted",
		untracked: "Untracked",
	};

	return (
		<Badge variant="outline" className={statusStyles[status]}>
			{statusLabels[status]}
		</Badge>
	);
});

GitStatusBadge.displayName = "GitStatusBadge";
