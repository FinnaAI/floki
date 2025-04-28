"use client";

import { DirectoryPermissionPrompt } from "@/components/directory-permission-prompt";
import { memo } from "react";

interface PermissionRequestProps {
	onOpenFolder: () => void;
}

export const PermissionRequest = memo(
	({ onOpenFolder }: PermissionRequestProps) => (
		<div className="p-4">
			<DirectoryPermissionPrompt />
		</div>
	),
);
PermissionRequest.displayName = "PermissionRequest";
