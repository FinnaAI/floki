import { useFileStore } from "@/store/file-store";
import { useFileTreeStore } from "@/store/file-tree-store";
import { useGitStatusStore } from "@/store/git-status-store";
import { useState } from "react";

export function useFileTree() {
	// State for creation dialogs
	const [draft, setDraft] = useState<{
		parentDir: string;
		isDirectory: boolean;
	} | null>(null);

	const [renameTarget, setRenameTarget] = useState<string | null>(null);
	const [draftName, setDraftName] = useState("");

	// Get state from stores
	const {
		files,
		selectedFile,
		loading,
		directoryLoading,
		error,
		currentPath,
		handleFileClick,
		toggleFileSelection,
		isFileSelected,
		openFolder,
		needsDirectoryPermission,
		createFile,
		createFolder,
		deleteFile,
	} = useFileStore();

	const { searchQuery, filteredFiles, setSearchQuery, clearSearch } =
		useFileTreeStore();

	const { isIgnored, getFileStatus, showIgnoredFiles } = useGitStatusStore();

	// Handle creation of new items
	const handleCreateItem = (
		isDirectory: boolean,
		parentDir: string = currentPath,
	) => {
		const defaultName = isDirectory ? "New Folder" : "new-file.ts";
		setDraft({ parentDir, isDirectory });
		setDraftName(defaultName);
	};

	// Handle committing draft (creating new file/folder)
	const commitDraft = async () => {
		if (!draft || !draftName) return;
		try {
			if (renameTarget) {
				await useFileStore.getState().renameItem(renameTarget, draftName);
				setRenameTarget(null);
			} else if (draft.isDirectory) {
				await createFolder(draft.parentDir, draftName);
			} else {
				await createFile(draft.parentDir, draftName);
			}
			// Force a refresh of the current directory to ensure the new item appears
			useFileStore.getState().refreshDirectory();
		} catch (e) {
			console.error("Error saving draft:", e);
		}
		setDraft(null);
		setDraftName("");
	};

	// Handle canceling draft
	const cancelDraft = () => {
		setDraft(null);
		setDraftName("");
		setRenameTarget(null);
	};

	return {
		// State
		files,
		filteredFiles,
		selectedFile,
		loading,
		directoryLoading,
		error,
		currentPath,
		searchQuery,
		needsDirectoryPermission,
		draft,
		draftName,
		renameTarget,

		// Git status
		isIgnored,
		getFileStatus,
		showIgnoredFiles,

		// Actions
		handleFileClick,
		toggleFileSelection,
		isFileSelected,
		openFolder,
		setSearchQuery,
		clearSearch,
		handleCreateItem,
		commitDraft,
		cancelDraft,
		setRenameTarget,
		setDraftName,
		deleteFile,
	};
}
