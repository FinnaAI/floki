"use client";
import { FileTree } from "@/components/file-tree";

export default function Sidebar() {
	return (
		<div className="flex h-full h-screen w-20 w-full flex-col gap-2 p-1">
			{/* <div className="m-2 flex gap-2">
				<Button
					onClick={handleOpenFolder}
					size="sm"
					className="w-full text-xs"
					variant="outline"
				>
					Open Folder
				</Button>
			</div> */}
			<FileTree />
		</div>
	);
}
