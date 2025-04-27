import { fireEvent, render, screen } from "@/test-utils";
import type { FileInfo } from "@/types/files";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileTree } from "../file-tree";
import { useFileTree } from "../hooks/use-file-tree";

vi.mock("../hooks/use-file-tree");

const mockFiles: FileInfo[] = [
	{
		name: "src",
		path: "/src",
		isDirectory: true,
		size: 0,
		lastModified: new Date(),
	},
	{
		name: "package.json",
		path: "/package.json",
		isDirectory: false,
		size: 100,
		lastModified: new Date(),
	},
];

const createMockHook = (overrides = {}) => ({
	files: [],
	filteredFiles: [],
	selectedFile: null,
	loading: false,
	directoryLoading: false,
	error: null,
	currentPath: "",
	searchQuery: "",
	needsDirectoryPermission: false,
	draft: null,
	draftName: "",
	renameTarget: null,
	isIgnored: vi.fn(),
	getFileStatus: vi.fn(),
	showIgnoredFiles: false,
	handleFileClick: vi.fn(),
	toggleFileSelection: vi.fn(),
	isFileSelected: vi.fn(),
	openFolder: vi.fn(),
	setSearchQuery: vi.fn(),
	clearSearch: vi.fn(),
	handleCreateItem: vi.fn(),
	commitDraft: vi.fn(),
	cancelDraft: vi.fn(),
	setRenameTarget: vi.fn(),
	setDraftName: vi.fn(),
	deleteFile: vi.fn(),
	...overrides,
});

describe("FileTree", () => {
	let mockHook: ReturnType<typeof createMockHook>;

	beforeEach(() => {
		mockHook = createMockHook();
		vi.mocked(useFileTree).mockReturnValue(mockHook);
	});

	describe("Search functionality", () => {
		it("renders search bar", () => {
			render(<FileTree />);
			expect(
				screen.getByPlaceholderText("Search files..."),
			).toBeInTheDocument();
		});

		it("handles search input", () => {
			render(<FileTree />);
			const searchInput = screen.getByPlaceholderText("Search files...");
			fireEvent.change(searchInput, { target: { value: "test" } });
			expect(mockHook.setSearchQuery).toHaveBeenCalledWith("test");
		});

		it("shows empty search results", () => {
			mockHook = createMockHook({
				files: [],
				filteredFiles: [],
				searchQuery: "nonexistent",
			});
			vi.mocked(useFileTree).mockReturnValue(mockHook);

			render(<FileTree />);
			expect(
				screen.getByText("No files match your search"),
			).toBeInTheDocument();
		});
	});

	describe("Permission and loading states", () => {
		it("shows permission request when needed", () => {
			mockHook = createMockHook({ needsDirectoryPermission: true });
			vi.mocked(useFileTree).mockReturnValue(mockHook);

			render(<FileTree />);
			expect(
				screen.getByText("Directory access needed to show files"),
			).toBeInTheDocument();

			const grantButton = screen.getByText("Grant Access");
			fireEvent.click(grantButton);
			expect(mockHook.openFolder).toHaveBeenCalled();
		});

		it("shows loading state", () => {
			mockHook = createMockHook({ directoryLoading: true });
			vi.mocked(useFileTree).mockReturnValue(mockHook);

			render(<FileTree />);
			expect(screen.getByText("Loading files...")).toBeInTheDocument();
		});

		it("shows error state", () => {
			mockHook = createMockHook({ error: "Test error" });
			vi.mocked(useFileTree).mockReturnValue(mockHook);

			render(<FileTree />);
			expect(screen.getByText("Error: Test error")).toBeInTheDocument();
		});
	});

	describe("File list rendering", () => {
		it("shows empty state when no files", () => {
			render(<FileTree />);
			expect(screen.getByText("This directory is empty")).toBeInTheDocument();
		});

		it("renders file list with files", () => {
			mockHook = createMockHook({
				files: mockFiles,
				filteredFiles: mockFiles,
			});
			vi.mocked(useFileTree).mockReturnValue(mockHook);

			render(<FileTree />);
			expect(screen.getByText("src")).toBeInTheDocument();
			expect(screen.getByText("package.json")).toBeInTheDocument();
		});
	});

	describe("File interactions", () => {
		beforeEach(() => {
			mockHook = createMockHook({
				files: mockFiles,
				filteredFiles: mockFiles,
			});
			vi.mocked(useFileTree).mockReturnValue(mockHook);
		});

		it("handles file selection", () => {
			render(<FileTree />);
			const fileButton = screen.getByText("package.json");
			fireEvent.click(fileButton);
			expect(mockHook.handleFileClick).toHaveBeenCalledWith(mockFiles[1]);
		});

		it("handles file checkbox selection", async () => {
			render(<FileTree />);
			const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
			expect(checkboxes).toHaveLength(2);
			await userEvent.click(checkboxes[1]);
			expect(mockHook.toggleFileSelection).toHaveBeenCalledWith(mockFiles[1]);
		});
	});
});
