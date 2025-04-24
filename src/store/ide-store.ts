import { create } from "zustand";
import { persist } from "zustand/middleware";

interface IDEState {
  currentAgent: string | null;
  currentFile: string | null;
  showFileTree: boolean;
  showFileContent: boolean;
  showTerminal: boolean;
  showCodex: boolean;

  // Actions
  setCurrentAgent: (agentId: string | null) => void;
  setCurrentFile: (fileId: string | null) => void;
  toggleFileTree: () => void;
  toggleFileContent: () => void;
  toggleTerminal: () => void;
  toggleCodex: () => void;
}

export const useIDEStore = create<IDEState>()(
  persist(
    (set) => ({
      // State
      currentAgent: null,
      currentFile: null,
      showFileTree: true,
      showFileContent: true,
      showTerminal: true,
      showCodex: true,

      // Actions
      setCurrentAgent: (agentId: string | null) =>
        set({ currentAgent: agentId }),
      setCurrentFile: (fileId: string | null) => set({ currentFile: fileId }),
      toggleFileTree: () =>
        set((state) => ({ showFileTree: !state.showFileTree })),
      toggleFileContent: () =>
        set((state) => ({ showFileContent: !state.showFileContent })),
      toggleTerminal: () =>
        set((state) => ({ showTerminal: !state.showTerminal })),
      toggleCodex: () => set((state) => ({ showCodex: !state.showCodex })),
    }),
    {
      name: "ide-storage", // unique name for localStorage key
    }
  )
);
