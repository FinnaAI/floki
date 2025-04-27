import { useIDEStore } from "@/store/ide-store";
import type { Monaco, OnMount } from "@monaco-editor/react";
import { useCallback, useRef } from "react";
import { createHighlighter } from "shiki";

interface UseMonacoOptions {
	onContentChange?: (content: string) => void;
	readOnly?: boolean;
}

export const useMonaco = ({
	onContentChange,
	readOnly = true,
}: UseMonacoOptions = {}) => {
	const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
	const monacoRef = useRef<Monaco | null>(null);
	const { addMonacoTheme, isThemeLoaded } = useIDEStore();

	const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;

		// Apply performance optimizations
		editor.getModel()?.setEOL(0); // Use \n for line endings

		// Set a default theme that's guaranteed to exist
		monaco.editor.defineTheme("default-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: {},
		});
		monaco.editor.setTheme("default-dark");

		// Optimize editor settings for performance
		editor.updateOptions({
			renderWhitespace: "none",
			renderControlCharacters: false,
			guides: { indentation: false },
			renderLineHighlight: "none",
			renderValidationDecorations: "editable",
			scrollBeyondLastLine: false,
			quickSuggestions: false,
			wordWrap: "on",
			minimap: {
				enabled: true,
				maxColumn: 80,
				showSlider: "mouseover",
				scale: 1.4,
			},
		});

		// Initialize additional languages
		void (async () => {
			const ADDITIONAL_LANGUAGES = [
				"jsx",
				"tsx",
				"vue",
				"svelte",
			] as const satisfies Parameters<typeof createHighlighter>[0]["langs"];

			for (const lang of ADDITIONAL_LANGUAGES) {
				monacoRef.current?.languages.register({ id: lang });
			}

			try {
				const highlighter = await createHighlighter({
					themes: ["vs-dark", "dark-plus", "github-dark", "github-light"],
					langs: ADDITIONAL_LANGUAGES,
				});

				if (monacoRef.current) {
					const { shikiToMonaco } = await import("@shikijs/monaco");
					shikiToMonaco(highlighter, monacoRef.current);
				}
			} catch (e) {
				console.warn("Error initializing syntax highlighter:", e);
			}
		})();
	}, []);

	const setTheme = useCallback(
		async (themeName: string) => {
			if (!monacoRef.current) return;

			// Check if theme is already loaded
			if (isThemeLoaded(themeName)) {
				monacoRef.current.editor.setTheme(
					themeName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
				);
				return;
			}

			try {
				const response = await fetch(`/api/themes/${themeName}`);
				const themeData = await response.json();

				const themeId = themeName.toLowerCase().replace(/[^a-z0-9]/g, "-");

				if (themeData.tokenColors) {
					for (const tokenColor of themeData.tokenColors) {
						if (tokenColor.settings && tokenColor.scope) {
							const settings: Record<string, string> = {
								...tokenColor.settings,
								fontStyle: tokenColor.settings.fontStyle,
								background: tokenColor.settings.background,
							};

							// Remove undefined properties
							for (const key of Object.keys(settings)) {
								if (settings[key] === undefined) {
									delete settings[key];
								}
							}
						}
					}
				}

				// Add theme to store
				addMonacoTheme(themeName, themeData);

				// Apply theme to editor
				monacoRef.current.editor.defineTheme(themeId, themeData);
				monacoRef.current.editor.setTheme(themeId);
			} catch (error) {
				console.error(`Failed to load theme ${themeName}:`, error);
			}
		},
		[addMonacoTheme, isThemeLoaded],
	);

	return {
		editorRef,
		monacoRef,
		handleEditorDidMount,
		setTheme,
	};
};

export type MonacoInstance = ReturnType<typeof useMonaco>;
