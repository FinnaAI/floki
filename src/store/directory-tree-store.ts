import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DirectoryTreeState {
  expandedPaths: Record<string, boolean>;
  toggleDir: (path: string) => void;
  isExpanded: (path: string) => boolean;
  setExpanded: (path: string, expanded: boolean) => void;
}

export const useDirectoryTreeStore = create<DirectoryTreeState>()(
  persist(
    (set, get) => ({
      expandedPaths: {},
      
      toggleDir: (path: string) => set(state => ({
        expandedPaths: {
          ...state.expandedPaths,
          [path]: !state.expandedPaths[path]
        }
      })),
      
      isExpanded: (path: string) => get().expandedPaths[path] ?? false,
      
      setExpanded: (path: string, expanded: boolean) => set(state => ({
        expandedPaths: {
          ...state.expandedPaths,
          [path]: expanded
        }
      }))
    }),
    {
      name: 'directory-tree-storage'
    }
  )
);

export const selectDirectoryTreeState = (state: DirectoryTreeState) => ({
  expandedPaths: state.expandedPaths,
  isExpanded: state.isExpanded,
});

export const selectDirectoryTreeActions = (state: DirectoryTreeState) => ({
  toggleDir: state.toggleDir,
  setExpanded: state.setExpanded,
});

export const directoryTreeActions = {
  toggleDir: (path: string) => useDirectoryTreeStore.getState().toggleDir(path),
  setExpanded: (path: string, expanded: boolean) => useDirectoryTreeStore.getState().setExpanded(path, expanded),
  isExpanded: (path: string) => useDirectoryTreeStore.getState().isExpanded(path),
};
