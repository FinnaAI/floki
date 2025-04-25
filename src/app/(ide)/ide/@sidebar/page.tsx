"use client";
import { FileTree } from "@/components/ide/file-tree";
import { createFileSystem } from "@/lib/file-system";
import { useFileStore } from "@/store/file-store";

const fileSystem = createFileSystem();

export default function Sidebar() {
	const { openFolder } = useFileStore();

	const handleOpenFolder = async () => {
		try {
			await openFolder();
		} catch (error) {
			console.error("Failed to open folder:", error);
		}
	};

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
