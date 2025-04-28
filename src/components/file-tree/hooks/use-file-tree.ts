import { useDirectoryTreeStore } from "@/store/directory-tree-store";
import { selectDirectoryTreeActions, selectDirectoryTreeState } from "@/store/directory-tree-store";
import { useFileStore } from "@/store/file-store";
import { selectFileActions, selectFileSelection, selectFileState } from "@/store/file-store";
import { useFileTreeStore } from "@/store/file-tree-store";
import { selectFileTreeActions, selectFileTreeState } from "@/store/file-tree-store";
import { useGitStatusStore } from "@/store/git-status-store";
import { selectGitStatusUtils } from '@/store/git-status-store';
import { useEffect, useState } from "react";
import { useShallow } from 'zustand/react/shallow';

export function useFileTree() {
	// State for creation dialogs
	const [draft, setDraft] = useState<{
		parentDir: string;
		isDirectory: boolean;
	} | null>(null);

	const [renameTarget, setRenameTarget] = useState<string | null>(null);
	const [draftName, setDraftName] = useState("");

	// Use selectors for cleaner state management
	const fileState = useFileStore(useShallow(selectFileState));
	const fileActions = useFileStore(useShallow(selectFileActions));
	const fileSelection = useFileStore(useShallow(selectFileSelection));
	
	const fileTreeState = useFileTreeStore(useShallow(selectFileTreeState));
	const fileTreeActions = useFileTreeStore(useShallow(selectFileTreeActions));
	
	const gitStatusUtils = useGitStatusStore(useShallow(selectGitStatusUtils));

	const directoryTreeState = useDirectoryTreeStore(
		useShallow(selectDirectoryTreeState)
	);
	const directoryTreeActions = useDirectoryTreeStore(
		useShallow(selectDirectoryTreeActions)
	);

	// Sync files with file-tree-store and handle filtering
	useEffect(() => {
		if (!fileTreeState.searchQuery) {
			useFileTreeStore.getState().setFilteredFiles(fileState.files);
			return;
		}

		const lowercaseQuery = fileTreeState.searchQuery.toLowerCase();
		const filtered = fileState.files.filter((file) =>
			file.name.toLowerCase().includes(lowercaseQuery),
		);

		useFileTreeStore.getState().setFilteredFiles(filtered);
	}, [fileState.files, fileTreeState.searchQuery]);

	// Handle creation of new items
	const handleCreateItem = (
		isDirectory: boolean,
		parentDir: string = fileState.currentPath,
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
				await useFileStore.getState().createFolder(draft.parentDir, draftName);
			} else {
				await useFileStore.getState().createFile(draft.parentDir, draftName);
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
		...fileState,
		...fileActions,
		...fileSelection,
		...fileTreeState,
		...fileTreeActions,
		...gitStatusUtils,
		...directoryTreeState,
		...directoryTreeActions,
		// Local state
		draft,
		draftName,
		renameTarget,
		// Local actions
		handleCreateItem,
		commitDraft,
		cancelDraft,
		setRenameTarget,
		setDraftName,
	};
}
