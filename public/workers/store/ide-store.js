import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useFileStore } from "./file-store";
export const useIDEStore = create()(persist((set, get) => ({
    // State
    currentAgent: null,
    currentFile: null,
    showFileTree: true,
    showFileContent: true,
    showTerminal: true,
    showCodex: true,
    editorTheme: "Twilight", // Default theme
    projects: [],
    activeProject: null,
    // Actions
    setCurrentAgent: (agentId) => set({ currentAgent: agentId }),
    setCurrentFile: (fileId) => set({ currentFile: fileId }),
    toggleFileTree: () => set((state) => ({ showFileTree: !state.showFileTree })),
    toggleFileContent: () => set((state) => ({ showFileContent: !state.showFileContent })),
    toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
    toggleCodex: () => set((state) => ({ showCodex: !state.showCodex })),
    setEditorTheme: (theme) => set({ editorTheme: theme }),
    addProject: (projectPath) => set((state) => {
        const projectName = projectPath.split("/").pop() || projectPath;
        const newProject = { path: projectPath, name: projectName };
        // Check if project already exists
        if (state.projects.some((p) => p.path === projectPath)) {
            return {
                ...state,
                activeProject: projectPath,
            };
        }
        return {
            projects: [...state.projects, newProject],
            activeProject: projectPath,
        };
    }),
    removeProject: (projectPath) => set((state) => ({
        projects: state.projects.filter((p) => p.path !== projectPath),
        activeProject: state.activeProject === projectPath ? null : state.activeProject,
    })),
    setActiveProject: (projectPath) => {
        set(() => ({
            activeProject: projectPath,
        }));
        // Initialize project when set
        if (typeof window !== "undefined") {
            setTimeout(() => {
                useFileStore.getState().initializeProject();
            }, 0);
        }
    },
    getProjectByPath: (projectPath) => {
        return get().projects.find((p) => p.path === projectPath);
    },
}), {
    name: "ide-store",
    onRehydrateStorage: () => {
        return (state) => {
            if (state?.activeProject && typeof window !== "undefined") {
                // Initialize project after rehydration
                setTimeout(() => {
                    useFileStore.getState().initializeProject();
                }, 0);
            }
        };
    },
}));
