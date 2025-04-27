"use client";

import { Button } from "@/components/ui/button";
import { memo } from "react";

interface PermissionRequestProps {
	onOpenFolder: () => void;
}

export const PermissionRequest = memo(
	({ onOpenFolder }: PermissionRequestProps) => (
		<div className="flex h-24 flex-col items-center justify-center gap-2 p-4 text-center">
			<p className="text-sm">Directory access needed to show files</p>
			<Button
				onClick={onOpenFolder}
				className="mt-2"
				variant="outline"
				size="sm"
			>
				Grant Access
			</Button>
		</div>
	),
);
PermissionRequest.displayName = "PermissionRequest";
