"use client";

import { Button } from "@/components/ui/button";
import { memo } from "react";

interface EmptyStateProps {
	searchQuery: string;
	onClearSearch: () => void;
}

export const EmptyState = memo(
	({ searchQuery, onClearSearch }: EmptyStateProps) => (
		<div className="flex h-24 flex-col items-center justify-center">
			{searchQuery ? (
				<>
					<p>No files match your search</p>
					<Button
						type="button"
						onClick={onClearSearch}
						className="mt-2"
						variant="outline"
						size="sm"
					>
						Clear search
					</Button>
				</>
			) : (
				<p>This directory is empty</p>
			)}
		</div>
	),
);
EmptyState.displayName = "EmptyState";
