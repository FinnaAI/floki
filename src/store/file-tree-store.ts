import type { FileInfo } from "@/types/files";
import { create } from "zustand";
import { subscribeWithSelector } from 'zustand/middleware'
import { useFileStore } from "./file-store";
interface FileTreeState {
	// State
	searchQuery: string;
	filteredFiles: FileInfo[];
	draft: { parentDir: string; isDirectory: boolean } | null;
	draftName: string;
	showDraft: boolean;
	
	// Actions
	setSearchQuery: (query: string) => void;
	setFilteredFiles: (files: FileInfo[]) => void;
	clearSearch: () => void;
	setDraft: (draft: { parentDir: string; isDirectory: boolean } | null) => void;
	setDraftName: (name: string) => void;
	
	handlers: {
		handleFileClick: (file: FileInfo) => void;
		handleToggleSelect: (file: FileInfo) => void;
		handleDelete: (path: string) => void;
		handleCreateItem: (isDirectory: boolean, parentPath: string) => void;
		handleRename: (path: string | null, newName?: string) => void;
		commitDraft: () => void;
		cancelDraft: () => void;
		isIgnored: (path: string) => boolean;
		getFileStatus: (path: string) => string;
		isSelected: (file: FileInfo) => boolean;
	};
}

export const useFileTreeStore = create<FileTreeState>()(
	subscribeWithSelector((set, get) => ({
		// Initial state
		searchQuery: "",
		filteredFiles: [],
		draft: null,
		draftName: "",
		showDraft: false,

		// Actions
		setSearchQuery: (query: string) => set({ searchQuery: query }),
		setFilteredFiles: (files: FileInfo[]) => set({ filteredFiles: files }),
		clearSearch: () => set({ searchQuery: "" }),
		setDraft: (draft) => set({ draft, showDraft: !!draft }),
		setDraftName: (name: string) => set({ draftName: name }),

		handlers: {
			handleFileClick: (file: FileInfo) => {
				useFileStore.getState().handleFileClick(file);
			},
			handleToggleSelect: (file: FileInfo) => {
				useFileStore.getState().toggleFileSelection(file);
			},
			handleDelete: (path: string) => {
				useFileStore.getState().deleteFile(path);
			},
			handleCreateItem: (isDirectory: boolean, parentPath: string) => {
				get().setDraft({ parentDir: parentPath, isDirectory });
				get().setDraftName(isDirectory ? "New Folder" : "new-file.ts");
			},
			handleRename: (path: string | null, newName?: string) => {
				if (path && newName) {
					useFileStore.getState().renameItem(path, newName);
				}
			},
			commitDraft: () => {
				const { draft, draftName } = get();
				if (!draft || !draftName) return;
				
				if (draft.isDirectory) {
					useFileStore.getState().createFolder(draft.parentDir, draftName);
				} else {
					useFileStore.getState().createFile(draft.parentDir, draftName);
				}
				
				get().setDraft(null);
			},
			cancelDraft: () => {
				get().setDraft(null);
				get().setDraftName("");
			},
			isIgnored: (path: string) => {
				const fileStore = useFileStore.getState();
				return typeof fileStore.isIgnored === 'function' 
					? fileStore.isIgnored(path) 
					: false;
			},
			getFileStatus: (path: string) => {
				const fileStore = useFileStore.getState();
				return typeof fileStore.getFileStatus === 'function'
					? fileStore.getFileStatus(path)
					: "";
			},
			isSelected: (file: FileInfo) => useFileStore.getState().isFileSelected(file)
		}
	}))
);

// Create selector functions that can be reused
export const selectSearchQuery = (state: FileTreeState) => state.searchQuery;
export const selectFilteredFiles = (state: FileTreeState) => state.filteredFiles;
export const selectFileTreeActions = (state: FileTreeState) => ({
	setSearchQuery: state.setSearchQuery,
	setFilteredFiles: state.setFilteredFiles,
	clearSearch: state.clearSearch,
});

// Add this: Actions object for direct state updates
export const fileTreeActions = {
	setFilteredFiles: (files: FileInfo[]) => useFileTreeStore.getState().setFilteredFiles(files),
	setSearchQuery: (query: string) => useFileTreeStore.getState().setSearchQuery(query),
	clearSearch: () => useFileTreeStore.getState().clearSearch(),
};

export const selectFileTreeState = (state: FileTreeState) => ({
	searchQuery: state.searchQuery,
	filteredFiles: state.filteredFiles,
});

export const selectFileTreeHandlers = (state: FileTreeState) => state.handlers;

