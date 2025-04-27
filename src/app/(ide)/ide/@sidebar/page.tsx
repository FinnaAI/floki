"use client";
import { FileTree } from "@/components/file-tree";

export default function Sidebar() {
	return (
		<div className="flex h-full h-screen w-20 w-full flex-col gap-2 p-1">
			<FileTree />
		</div>
	);
}
