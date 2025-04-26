import { create } from "zustand";
export const useFileTreeStore = create((set, get) => ({
    // Initial state
    searchQuery: "",
    filteredFiles: [],
    // Actions
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilteredFiles: (files) => set({ filteredFiles: files }),
    clearSearch: () => set({ searchQuery: "" }),
}));
