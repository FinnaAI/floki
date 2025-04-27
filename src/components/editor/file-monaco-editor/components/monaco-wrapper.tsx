import dynamic from "next/dynamic";
import React, { useEffect } from "react";
import { useMonaco } from "../hooks/use-monaco";
import type { FileInfo } from "../types";
import { getLanguageFromFileName } from "../utils/language-map";

// Monaco must load on the client only with no loading UI
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
	ssr: false,
	loading: () => null,
});

interface MonacoWrapperProps {
	selectedFile: FileInfo;
	fileContent: string | null;
	isEditing?: boolean;
	theme: string;
	onContentChange?: (content: string) => void;
}

export const MonacoWrapper = React.memo(
	({
		selectedFile,
		fileContent,
		isEditing = false,
		theme,
		onContentChange,
	}: MonacoWrapperProps) => {
		const { handleEditorDidMount, setTheme: updateTheme } = useMonaco({
			onContentChange,
			readOnly: !isEditing,
		});

		// Update theme when it changes
		useEffect(() => {
			void updateTheme(theme);
		}, [theme, updateTheme]);

		return (
			<div className="h-[70vh] w-full overflow-hidden">
				<MonacoEditor
					height="70vh"
					language={getLanguageFromFileName(selectedFile.name)}
					value={fileContent || ""}
					theme={theme}
					className=""
					options={{
						readOnly: !isEditing,
						minimap: {
							enabled: true,
							showSlider: "mouseover",
							scale: 1.4,
							maxColumn: 80,
						},
						scrollBeyondLastLine: false,
						fontSize: 14,
						wordWrap: "on",
						automaticLayout: true,
						renderWhitespace: "none",
						renderControlCharacters: false,
						renderLineHighlight: "none",
						quickSuggestions: false,
						folding: false,
						glyphMargin: false,
						renderValidationDecorations: "editable",
					}}
					onChange={(value) => {
						if (isEditing && onContentChange) {
							onContentChange(value || "");
						}
					}}
					onMount={handleEditorDidMount}
				/>
			</div>
		);
	},
);

MonacoWrapper.displayName = "MonacoWrapper";
