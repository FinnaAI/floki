import type { FileInfo } from "@/types/files";
import { beforeEach, describe, expect, it } from "vitest";
import { useFileTreeStore } from "../file-tree-store";

describe("FileTreeStore", () => {
	beforeEach(() => {
		// Clear the store before each test
		useFileTreeStore.setState({
			searchQuery: "",
			filteredFiles: [],
		});
	});

	const mockFiles: FileInfo[] = [
		{
			name: "test.ts",
			path: "/test.ts",
			isDirectory: false,
			size: 100,
			lastModified: new Date(),
		},
	];

	describe("search functionality", () => {
		it("should set search query", () => {
			const { setSearchQuery } = useFileTreeStore.getState();
			setSearchQuery("test");

			expect(useFileTreeStore.getState().searchQuery).toBe("test");
		});

		it("should clear search", () => {
			const { setSearchQuery, clearSearch } = useFileTreeStore.getState();

			setSearchQuery("test");
			expect(useFileTreeStore.getState().searchQuery).toBe("test");

			clearSearch();
			expect(useFileTreeStore.getState().searchQuery).toBe("");
		});
	});

	describe("filtered files", () => {
		it("should set filtered files", () => {
			const { setFilteredFiles } = useFileTreeStore.getState();

			setFilteredFiles(mockFiles);
			expect(useFileTreeStore.getState().filteredFiles).toEqual(mockFiles);
		});
	});
});
