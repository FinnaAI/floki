import { create } from "zustand";
export const useFileTreeStore = create((set, get) => ({
    // Initial state
    expandedFolders: {},
    searchQuery: "",
    filteredFiles: [],
    // Actions
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilteredFiles: (files) => set({ filteredFiles: files }),
    clearSearch: () => set({ searchQuery: "" }),
    toggleFolderExpanded: (folderPath) => {
        set((state) => {
            const newExpandedFolders = { ...state.expandedFolders };
            const currentValue = !!state.expandedFolders[folderPath];
            console.log(`Toggling folder ${folderPath} from ${currentValue} to ${!currentValue}`);
            newExpandedFolders[folderPath] = !currentValue;
            return { expandedFolders: newExpandedFolders };
        });
    },
    isFolderExpanded: (folderPath) => {
        const state = get();
        return folderPath in state.expandedFolders
            ? !!state.expandedFolders[folderPath]
            : false;
    },
}));
