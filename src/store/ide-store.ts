import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useFileStore } from "./file-store";

export interface Project {
	path: string;
	name: string;
}

export interface FileTab {
	id: string; // File path as ID
	name: string;
	path: string;
}

interface MonacoThemeData {
	base: string;
	inherit: boolean;
	rules: Array<{
		token: string;
		foreground?: string;
		background?: string;
		fontStyle?: string;
	}>;
	colors: Record<string, string>;
}

interface MonacoTheme {
	id: string;
	data: MonacoThemeData;
	isLoaded: boolean;
}

interface IDEState {
	currentAgent: string | null;
	currentFile: string | null;
	showFileTree: boolean;
	showFileContent: boolean;
	showTerminal: boolean;
	showCodex: boolean;
	editorTheme: string;
	monacoThemes: Record<string, MonacoTheme>;
	projects: Project[];
	activeProject: string | null;
	
	// File tabs related state
	openTabs: Record<string, FileTab[]>; // Map of projectPath -> opened file tabs
	activeTab: Record<string, string | null>; // Map of projectPath -> active tab id

	// Actions
	setCurrentAgent: (agentId: string | null) => void;
	setCurrentFile: (fileId: string | null) => void;
	toggleFileTree: () => void;
	toggleFileContent: () => void;
	toggleTerminal: () => void;
	toggleCodex: () => void;
	setEditorTheme: (theme: string) => void;
	addMonacoTheme: (themeName: string, themeData: MonacoThemeData) => void;
	isThemeLoaded: (themeName: string) => boolean;
	addProject: (projectPath: string) => void;
	removeProject: (projectPath: string) => void;
	setActiveProject: (projectPath: string) => void;
	getProjectByPath: (projectPath: string) => Project | undefined;
	
	// File tabs related actions
	addFileTab: (file: { path: string; name: string }) => void;
	closeFileTab: (tabId: string) => void;
	setActiveFileTab: (tabId: string | null) => void;
	getOpenTabs: () => FileTab[];
	getActiveFileTab: () => string | null;
}

export const useIDEStore = create<IDEState>()(
	persist(
		(set, get) => ({
			// State
			currentAgent: null,
			currentFile: null,
			showFileTree: true,
			showFileContent: true,
			showTerminal: true,
			showCodex: true,
			editorTheme: "Twilight", // Default theme matching FileMonacoEditor
			monacoThemes: {},
			projects: [],
			activeProject: null,
			openTabs: {},
			activeTab: {},

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

			setEditorTheme: (theme: string) => set({ editorTheme: theme }),

			addMonacoTheme: (themeName: string, themeData: MonacoThemeData) =>
				set((state) => {
					const themeId = themeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
					return {
						monacoThemes: {
							...state.monacoThemes,
							[themeName]: {
								id: themeId,
								data: themeData,
								isLoaded: true,
							},
						},
					};
				}),

			isThemeLoaded: (themeName: string) => {
				const theme = get().monacoThemes[themeName];
				return Boolean(theme?.isLoaded);
			},

			addProject: (projectPath: string) =>
				set((state) => {
					const projectName = projectPath.split("/").pop() || projectPath;
					const newProject = { path: projectPath, name: projectName };

					// Check if project already exists
					if (state.projects.some((p) => p.path === projectPath)) {
						return {
							...state,
							activeProject: projectPath,
						};
					}

					// Ensure openTabs & activeTab have entries for the new project
					const openTabs = { ...state.openTabs };
					openTabs[projectPath] = [];
					
					const activeTab = { ...state.activeTab };
					activeTab[projectPath] = null;

					return {
						projects: [...state.projects, newProject],
						activeProject: projectPath,
						openTabs,
						activeTab
					};
				}),

			removeProject: (projectPath: string) =>
				set((state) => {
					// Create new objects without the removed project
					const openTabs = { ...state.openTabs };
					delete openTabs[projectPath];
					
					const activeTab = { ...state.activeTab };
					delete activeTab[projectPath];
					
					return {
						projects: state.projects.filter((p) => p.path !== projectPath),
						activeProject:
							state.activeProject === projectPath ? null : state.activeProject,
						openTabs,
						activeTab
					};
				}),

			setActiveProject: (projectPath: string) => {
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

			getProjectByPath: (projectPath: string) => {
				return get().projects.find((p) => p.path === projectPath);
			},
			
			// File tabs related actions
			addFileTab: (file) => {
				const { activeProject } = get();
				if (!activeProject) return;
				
				set((state) => {
					// Get current tabs for this project
					const projectTabs = state.openTabs[activeProject] || [];
					
					// Check if file is already open
					const existingTabIndex = projectTabs.findIndex(tab => tab.id === file.path);
					
					// If already open, just set it as active
					if (existingTabIndex >= 0) {
						const activeTab = { ...state.activeTab };
						activeTab[activeProject] = file.path;
						
						return { activeTab };
					}
					
					// Otherwise, add new tab and set as active
					const newTab: FileTab = {
						id: file.path,
						name: file.name,
						path: file.path
					};
					
					const openTabs = { ...state.openTabs };
					const tabs = [...projectTabs, newTab];
					openTabs[activeProject] = tabs;
					
					const activeTab = { ...state.activeTab };
					activeTab[activeProject] = file.path;
					
					return { openTabs, activeTab };
				});
			},
			
			closeFileTab: (tabId) => {
				const { activeProject } = get();
				if (!activeProject) return;
				
				set((state) => {
					// Get current tabs for this project
					const projectTabs = state.openTabs[activeProject] || [];
					
					// Find the tab to close
					const tabIndex = projectTabs.findIndex(tab => tab.id === tabId);
					if (tabIndex === -1) return state;
					
					// Create new tabs array without the closed tab
					const newTabs = projectTabs.filter((_, i) => i !== tabIndex);
					
					// Update openTabs
					const openTabs = { ...state.openTabs };
					openTabs[activeProject] = newTabs;
					
					// Determine new active tab
					const activeTab = { ...state.activeTab };
					const currentActive = activeTab[activeProject];
					
					// If we're closing the active tab, set a new active tab
					if (currentActive === tabId) {
						if (newTabs.length > 0) {
							// Try to select the tab to the left, or the first tab
							const newActiveIndex = Math.min(tabIndex, newTabs.length - 1);
							activeTab[activeProject] = newTabs[newActiveIndex]?.id || null;
						} else {
							activeTab[activeProject] = null;
						}
					}
					
					return { openTabs, activeTab };
				});
			},
			
			setActiveFileTab: (tabId) => {
				const { activeProject } = get();
				if (!activeProject) return;
				
				set((state) => {
					const activeTab = { ...state.activeTab };
					activeTab[activeProject] = tabId;
					return { activeTab };
				});
			},
			
			getOpenTabs: () => {
				const { activeProject, openTabs } = get();
				if (!activeProject) return [];
				return openTabs[activeProject] || [];
			},
			
			getActiveFileTab: () => {
				const { activeProject, activeTab } = get();
				if (!activeProject) return null;
				return activeTab[activeProject] || null;
			}
		}),
		{
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
		},
	),
);
