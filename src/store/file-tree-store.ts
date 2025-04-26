import type { FileInfo } from "@/types/files";
import { create } from "zustand";

interface FileTreeState {
	// State
	searchQuery: string;
	filteredFiles: FileInfo[];

	// Actions
	setSearchQuery: (query: string) => void;
	setFilteredFiles: (files: FileInfo[]) => void;
	clearSearch: () => void;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
	// Initial state
	searchQuery: "",
	filteredFiles: [],

	// Actions
	setSearchQuery: (query: string) => set({ searchQuery: query }),
	setFilteredFiles: (files: FileInfo[]) => set({ filteredFiles: files }),
	clearSearch: () => set({ searchQuery: "" }),
}));
