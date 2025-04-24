import { create } from "zustand";
import type { FileInfo } from "@/types/files";

interface FileTreeState {
  // State
  files: FileInfo[];
  selectedFile: FileInfo | null;
  loading: boolean;
  directoryLoading: boolean;
  error: string | null;
  searchQuery: string;
  filteredFiles: FileInfo[];
  currentPath: string;
  expandedFolders: Record<string, boolean>;
  selectedFiles: Record<string, boolean>;

  // Actions
  setFiles: (files: FileInfo[]) => void;
  setSelectedFile: (file: FileInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setDirectoryLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilteredFiles: (files: FileInfo[]) => void;
  setCurrentPath: (path: string) => void;
  clearSearch: () => void;
  toggleFileSelection: (file: FileInfo) => void;
  isFileSelected: (file: FileInfo) => boolean;
  toggleFolderExpanded: (folderPath: string) => void;
  isFolderExpanded: (folderPath: string) => boolean;
  handleFileClick: (file: FileInfo) => void;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
  // Initial state
  files: [],
  selectedFile: null,
  loading: false,
  directoryLoading: false,
  error: null,
  searchQuery: "",
  filteredFiles: [],
  currentPath: "",
  expandedFolders: {},
  selectedFiles: {},

  // Actions
  setFiles: (files: FileInfo[]) => set({ files }),
  setSelectedFile: (file: FileInfo | null) => set({ selectedFile: file }),
  setLoading: (loading: boolean) => set({ loading }),
  setDirectoryLoading: (loading: boolean) => set({ directoryLoading: loading }),
  setError: (error: string | null) => set({ error }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilteredFiles: (files: FileInfo[]) => set({ filteredFiles: files }),
  setCurrentPath: (path: string) => set({ currentPath: path }),

  clearSearch: () => set({ searchQuery: "", filteredFiles: get().files }),

  toggleFileSelection: (file: FileInfo) => {
    set((state) => {
      const newSelectedFiles = { ...state.selectedFiles };
      if (newSelectedFiles[file.path]) {
        delete newSelectedFiles[file.path];
      } else {
        newSelectedFiles[file.path] = true;
      }
      return { selectedFiles: newSelectedFiles };
    });
  },

  isFileSelected: (file: FileInfo) => {
    return !!get().selectedFiles[file.path];
  },

  toggleFolderExpanded: (folderPath: string) => {
    set((state) => {
      const newExpandedFolders = { ...state.expandedFolders };
      newExpandedFolders[folderPath] = !state.expandedFolders[folderPath];
      return { expandedFolders: newExpandedFolders };
    });
  },

  isFolderExpanded: (folderPath: string) => {
    return !!get().expandedFolders[folderPath];
  },

  handleFileClick: (file: FileInfo) => {
    if (file.isDirectory) {
      // Toggle folder expansion
      get().toggleFolderExpanded(file.path);
    } else {
      // Handle file selection
      set({ selectedFile: file });
      // Additional file handling logic can be added here
    }
  },
}));
