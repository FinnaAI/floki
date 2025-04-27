import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useFileStore } from "./file-store";

export interface Project {
	path: string;
	name: string;
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

					return {
						projects: [...state.projects, newProject],
						activeProject: projectPath,
					};
				}),

			removeProject: (projectPath: string) =>
				set((state) => ({
					projects: state.projects.filter((p) => p.path !== projectPath),
					activeProject:
						state.activeProject === projectPath ? null : state.activeProject,
				})),

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
