import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MonacoWrapper } from "../components/monaco-wrapper";
import { useMonaco } from "../hooks/use-monaco";

// Mock the useMonaco hook with proper state management
const mockSetTheme = vi.fn();
const mockMonacoHook = {
	handleEditorDidMount: vi.fn(),
	setTheme: mockSetTheme,
};

vi.mock("../hooks/use-monaco", () => ({
	useMonaco: vi.fn(() => mockMonacoHook),
}));

// Mock React's useEffect to execute immediately
vi.mock("react", async () => {
	const actual = await vi.importActual("react");
	return {
		...actual,
		useEffect: (callback: () => void) => callback(),
	};
});

describe("MonacoWrapper", () => {
	const mockFile = {
		name: "test.ts",
		path: "/test.ts",
		isDirectory: false,
		size: 100,
		lastModified: new Date(),
	};

	it("renders with correct props", () => {
		render(
			<MonacoWrapper
				selectedFile={mockFile}
				fileContent="test content"
				theme="test-theme"
			/>,
		);

		expect(useMonaco).toHaveBeenCalledWith({
			onContentChange: undefined,
			readOnly: true,
		});
	});

	it("handles theme changes", async () => {
		render(
			<MonacoWrapper
				selectedFile={mockFile}
				fileContent="test content"
				theme="new-theme"
			/>,
		);

		await vi.waitFor(() => {
			expect(mockSetTheme).toHaveBeenCalledWith("new-theme");
		});
	});

	it("handles content changes in edit mode", () => {
		const onContentChange = vi.fn();

		render(
			<MonacoWrapper
				selectedFile={mockFile}
				fileContent="test content"
				theme="test-theme"
				isEditing={true}
				onContentChange={onContentChange}
			/>,
		);

		expect(useMonaco).toHaveBeenCalledWith({
			onContentChange,
			readOnly: false,
		});
	});
});
