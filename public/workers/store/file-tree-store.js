import { create } from "zustand";
import { subscribeWithSelector } from 'zustand/middleware';
import { useFileStore } from "./file-store";
export const useFileTreeStore = create()(subscribeWithSelector((set, get) => ({
    // Initial state
    searchQuery: "",
    filteredFiles: [],
    draft: null,
    draftName: "",
    showDraft: false,
    // Actions
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilteredFiles: (files) => set({ filteredFiles: files }),
    clearSearch: () => set({ searchQuery: "" }),
    setDraft: (draft) => set({ draft, showDraft: !!draft }),
    setDraftName: (name) => set({ draftName: name }),
    handlers: {
        handleFileClick: (file) => {
            useFileStore.getState().handleFileClick(file);
        },
        handleToggleSelect: (file) => {
            useFileStore.getState().toggleFileSelection(file);
        },
        handleDelete: (path) => {
            useFileStore.getState().deleteFile(path);
        },
        handleCreateItem: (isDirectory, parentPath) => {
            get().setDraft({ parentDir: parentPath, isDirectory });
            get().setDraftName(isDirectory ? "New Folder" : "new-file.ts");
        },
        handleRename: (path, newName) => {
            if (path && newName) {
                useFileStore.getState().renameItem(path, newName);
            }
        },
        commitDraft: () => {
            const { draft, draftName } = get();
            if (!draft || !draftName)
                return;
            if (draft.isDirectory) {
                useFileStore.getState().createFolder(draft.parentDir, draftName);
            }
            else {
                useFileStore.getState().createFile(draft.parentDir, draftName);
            }
            get().setDraft(null);
        },
        cancelDraft: () => {
            get().setDraft(null);
            get().setDraftName("");
        },
        isIgnored: (path) => {
            const fileStore = useFileStore.getState();
            return typeof fileStore.isIgnored === 'function'
                ? fileStore.isIgnored(path)
                : false;
        },
        getFileStatus: (path) => {
            const fileStore = useFileStore.getState();
            return typeof fileStore.getFileStatus === 'function'
                ? fileStore.getFileStatus(path)
                : "";
        },
        isSelected: (file) => useFileStore.getState().isFileSelected(file)
    }
})));
// Create selector functions that can be reused
export const selectSearchQuery = (state) => state.searchQuery;
export const selectFilteredFiles = (state) => state.filteredFiles;
export const selectFileTreeActions = (state) => ({
    setSearchQuery: state.setSearchQuery,
    setFilteredFiles: state.setFilteredFiles,
    clearSearch: state.clearSearch,
});
// Add this: Actions object for direct state updates
export const fileTreeActions = {
    setFilteredFiles: (files) => useFileTreeStore.getState().setFilteredFiles(files),
    setSearchQuery: (query) => useFileTreeStore.getState().setSearchQuery(query),
    clearSearch: () => useFileTreeStore.getState().clearSearch(),
};
export const selectFileTreeState = (state) => ({
    searchQuery: state.searchQuery,
    filteredFiles: state.filteredFiles,
});
export const selectFileTreeHandlers = (state) => state.handlers;
