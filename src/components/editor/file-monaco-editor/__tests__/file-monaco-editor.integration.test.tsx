import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileMonacoEditor } from "../index";

const mockSetEditorTheme = vi.fn();

vi.mock("@/store/ide-store", () => ({
	useIDEStore: () => ({
		theme: "vs-dark",
		setEditorTheme: mockSetEditorTheme,
		editorTheme: "vs-dark",
	}),
}));

vi.mock("@/store/git-status-store", () => ({
	useGitStatusStore: () => ({
		getFileStatus: () => null,
		fetchGitStatus: vi.fn(),
	}),
}));

// Mock fetch for theme loading
global.fetch = vi.fn(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve({ themes: ["test-theme", "Twilight"] }),
	}),
) as unknown as typeof fetch;

const mockFile = {
	path: "test.ts",
	name: "test.ts",
	size: 100,
	lastModified: new Date(),
	isDirectory: false,
};

describe("FileMonacoEditor", () => {
	it("renders file content", async () => {
		render(
			<FileMonacoEditor
				selectedFile={mockFile}
				fileContent="test content"
				fileDiff={null}
				loading={false}
				error={null}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("monaco-editor")).toBeInTheDocument();
		});
	});

	it("handles theme switching", async () => {
		render(
			<FileMonacoEditor
				selectedFile={mockFile}
				fileContent="test content"
				fileDiff={null}
				loading={false}
				error={null}
			/>,
		);

		const themeSelect = screen.getByTestId("select-trigger");
		await userEvent.click(themeSelect);

		const themeOption = screen.getByTestId("select-item-Twilight");
		await userEvent.click(themeOption);

		expect(mockSetEditorTheme).toHaveBeenCalledWith("Twilight");
	});

	it("handles edit mode toggle", async () => {
		render(
			<FileMonacoEditor
				selectedFile={mockFile}
				fileContent="test content"
				fileDiff={null}
				loading={false}
				error={null}
			/>,
		);

		const editButton = screen.getByText("Edit");
		await userEvent.click(editButton);

		const editor = screen.getByTestId("monaco-editor");
		expect(editor).toBeInTheDocument();
	});

	it("handles image files", async () => {
		const imageFile = {
			...mockFile,
			path: "test.png",
			name: "test.png",
		};

		render(
			<FileMonacoEditor
				selectedFile={imageFile}
				fileContent="test content"
				fileDiff={null}
				loading={false}
				error={null}
			/>,
		);

		// For image files, we should see an img element
		await waitFor(() => {
			expect(screen.getByRole("img")).toBeInTheDocument();
		});
	});
});
