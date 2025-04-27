import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFileStore } from "../file-store";
import { useIDEStore } from "../ide-store";

// Mock file store
vi.mock("../file-store", () => ({
	useFileStore: {
		getState: () => ({
			initializeProject: vi.fn(),
		}),
	},
}));

describe("IDEStore", () => {
	beforeEach(() => {
		// Clear the store before each test
		useIDEStore.setState({
			currentAgent: null,
			currentFile: null,
			showFileTree: true,
			showFileContent: true,
			showTerminal: true,
			showCodex: true,
			editorTheme: "Twilight",
			monacoThemes: {},
			projects: [],
			activeProject: null,
		});
	});

	describe("UI state management", () => {
		it("should toggle file tree", () => {
			const { toggleFileTree } = useIDEStore.getState();

			toggleFileTree();
			expect(useIDEStore.getState().showFileTree).toBe(false);

			toggleFileTree();
			expect(useIDEStore.getState().showFileTree).toBe(true);
		});

		it("should set editor theme", () => {
			const { setEditorTheme } = useIDEStore.getState();

			setEditorTheme("Dark");
			expect(useIDEStore.getState().editorTheme).toBe("Dark");
		});
	});

	describe("Monaco theme management", () => {
		const mockTheme = {
			colors: { "editor.background": "#000000" },
		};

		it("should add monaco theme", () => {
			const { addMonacoTheme, isThemeLoaded } = useIDEStore.getState();

			addMonacoTheme("Night", mockTheme);

			expect(isThemeLoaded("Night")).toBe(true);
			expect(useIDEStore.getState().monacoThemes.Night).toEqual({
				id: "night",
				data: mockTheme,
				isLoaded: true,
			});
		});
	});

	describe("Project management", () => {
		const mockProject = {
			path: "/test/project",
			name: "project",
		};

		it("should add project", () => {
			const { addProject } = useIDEStore.getState();

			addProject(mockProject.path);

			const state = useIDEStore.getState();
			expect(state.projects[0]).toEqual(mockProject);
			expect(state.activeProject).toBe(mockProject.path);
		});

		it("should remove project", () => {
			const { addProject, removeProject } = useIDEStore.getState();

			addProject(mockProject.path);
			removeProject(mockProject.path);

			const state = useIDEStore.getState();
			expect(state.projects).toHaveLength(0);
			expect(state.activeProject).toBeNull();
		});

		it("should set active project and initialize", () => {
			const { setActiveProject } = useIDEStore.getState();
			const initializeProject = useFileStore.getState().initializeProject;

			setActiveProject(mockProject.path);

			expect(useIDEStore.getState().activeProject).toBe(mockProject.path);

			// Wait for the setTimeout
			vi.runAllTimers();
			expect(initializeProject).toHaveBeenCalled();
		});
	});
});
