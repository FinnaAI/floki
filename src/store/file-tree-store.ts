import type { FileInfo } from "@/types/files";
import { create } from "zustand";

interface FileTreeState {
	// State
	expandedFolders: Record<string, boolean>;
	searchQuery: string;
	filteredFiles: FileInfo[];

	// Actions
	setSearchQuery: (query: string) => void;
	setFilteredFiles: (files: FileInfo[]) => void;
	clearSearch: () => void;
	toggleFolderExpanded: (folderPath: string) => void;
	isFolderExpanded: (folderPath: string) => boolean;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
	// Initial state
	expandedFolders: {},
	searchQuery: "",
	filteredFiles: [],

	// Actions
	setSearchQuery: (query: string) => set({ searchQuery: query }),
	setFilteredFiles: (files: FileInfo[]) => set({ filteredFiles: files }),

	clearSearch: () => set({ searchQuery: "" }),

	toggleFolderExpanded: (folderPath: string) => {
		set((state) => {
			const newExpandedFolders = { ...state.expandedFolders };
			const currentValue = !!state.expandedFolders[folderPath];
			console.log(
				`Toggling folder ${folderPath} from ${currentValue} to ${!currentValue}`,
			);
			newExpandedFolders[folderPath] = !currentValue;
			return { expandedFolders: newExpandedFolders };
		});
	},

	isFolderExpanded: (folderPath: string) => {
		const state = get();
		return folderPath in state.expandedFolders
			? !!state.expandedFolders[folderPath]
			: false;
	},
}));
