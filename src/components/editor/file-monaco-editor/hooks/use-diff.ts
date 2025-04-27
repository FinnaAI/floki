import { useCallback, useRef, useState } from "react";
import type { DiffEditorType } from "../types";

interface FileDiff {
	oldContent: string;
	newContent: string;
	hunks: Array<{
		oldStart: number;
		oldLines: number;
		newStart: number;
		newLines: number;
		lines: string[];
	}>;
}

interface UseDiffOptions {
	currentPath?: string;
	fileStatus?: string | null;
}

export const useDiff = ({
	currentPath = "",
	fileStatus,
}: UseDiffOptions = {}) => {
	const [showDiff, setShowDiff] = useState(false);
	const [diffData, setDiffData] = useState<FileDiff | null>(null);
	const diffEditorRef = useRef<DiffEditorType | null>(null);

	const loadDiff = useCallback(
		async (filePath: string, currentContent: string) => {
			if (!filePath) return;

			try {
				// Only load diff for modified files
				if (fileStatus === "modified") {
					// Reset diff state before loading
					setDiffData(null);

					const encodedPath = encodeURIComponent(filePath);
					const encodedRoot = encodeURIComponent(currentPath);
					const encodedContent = encodeURIComponent(currentContent);

					const response = await fetch(
						`/api/git/diff?path=${encodedPath}&rootPath=${encodedRoot}&currentContent=${encodedContent}`,
					);

					if (response.ok) {
						const data = await response.json();

						if (data && !data.error) {
							const newDiffData: FileDiff = {
								oldContent: String(data.oldContent || ""),
								newContent: String(data.newContent || currentContent || ""),
								hunks: data.hunks || [],
							};

							setDiffData(newDiffData);
							setShowDiff(true);
							return;
						}

						console.error("Error in diff data:", data.error);
						setDiffData({
							oldContent: "",
							newContent: currentContent || "",
							hunks: [],
						});
					} else {
						console.error(
							"Error fetching diff, response not OK:",
							response.status,
						);
						setDiffData({
							oldContent: "",
							newContent: currentContent || "",
							hunks: [],
						});
					}
				} else {
					// For non-modified files, create empty diff
					setDiffData({
						oldContent: "",
						newContent: currentContent || "",
						hunks: [],
					});
				}
				setShowDiff(true);
			} catch (error) {
				console.error("Error in loadDiff:", error);
				setShowDiff(false);
			}
		},
		[currentPath, fileStatus],
	);

	const toggleDiff = useCallback(() => {
		setShowDiff((prev) => !prev);
	}, []);

	const handleDiffEditorMount = useCallback((editor: DiffEditorType) => {
		diffEditorRef.current = editor;
	}, []);

	return {
		showDiff,
		diffData,
		diffEditorRef,
		loadDiff,
		toggleDiff,
		handleDiffEditorMount,
	};
};

export type DiffInstance = ReturnType<typeof useDiff>;
