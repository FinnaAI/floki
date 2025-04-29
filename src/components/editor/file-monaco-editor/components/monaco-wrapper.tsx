import { GenerateInstructions } from "@/app/api/completion/prompt";
import { useDebounce } from "@/hooks/use-debounce";
import { useCompletion } from "@ai-sdk/react";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMonaco } from "../hooks/use-monaco";
import type { FileInfo } from "../types";
import { getLanguageFromFileName } from "../utils/language-map";
import { CompletionFormatter } from "./completion-formatter";
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
		console.log("MonacoWrapper rendering", { selectedFile, theme });

		const {
			handleEditorDidMount,
			setTheme: updateTheme,
			editorRef,
			monacoRef,
		} = useMonaco({
			onContentChange,
			readOnly: !isEditing,
		});

		const [isDialogOpen, setIsDialogOpen] = useState(false);
		const [highlightedText, setHighlightedText] = useState("");
		const [selectedLines, setSelectedLines] = useState<{
			startLineNumber: number;
			endLineNumber: number;
		} | null>(null);

		// Add debounced content change handler to prevent excessive saving
		const { debouncedCallback: debouncedContentChange } = useDebounce(
			(value: string) => {
				if (isEditing && onContentChange) {
					onContentChange(value);
				}
			},
			1000, // 1 second debounce to reduce saving toasts
		);

		const { completion, complete } = useCompletion({
			api: "/api/completion",
		});

		// Refs to manage fetching and timing of suggestions
		const fetchSuggestionsIntervalRef = useRef<number | undefined>(undefined);
		const timeoutRef = useRef<number | undefined>(undefined);

		const refreshInterval = 500;
		const language = getLanguageFromFileName(selectedFile.name);

		// State to cache suggestions received from the AI completion API
		const [cachedSuggestions, setCachedSuggestions] = useState<
			{
				insertText: string;
				range: {
					startLineNumber: number;
					startColumn: number;
					endLineNumber: number;
					endColumn: number;
				};
			}[]
		>([]);

		const debouncedSuggestions = useCallback(() => {
			// Access the current model (document) of the editor
			const model = monacoRef.current?.editor.getModels()[0];

			if (!model || !model.getValue()) {
				setCachedSuggestions([]);
				return;
			}

			const position = editorRef.current?.getPosition();
			if (!position) return;
			const currentLine = model.getLineContent(position.lineNumber);
			const offset = model.getOffsetAt(position);
			const textBeforeCursor = model
				.getValue()
				.substring(0, offset - currentLine.length);
			const textBeforeCursorOnCurrentLine = currentLine.substring(
				0,
				position.column - 1,
			);

			if (!textBeforeCursor) return;

			const messages = [
				GenerateInstructions(getLanguageFromFileName(selectedFile.name)),
				{
					content: textBeforeCursor,
					role: "user",
					name: "TextBeforeCursor",
				},
				{
					content: textBeforeCursorOnCurrentLine,
					role: "user",
					name: "TextBeforeCursorOnCurrentLine",
				},
			];

			// Call the completion API and handle the response
			complete("", {
				body: {
					messages,
				},
			})
				.then((newCompletion) => {
					if (newCompletion) {
						// Construct a new suggestion object based on the API response
						const newSuggestion = {
							insertText: newCompletion,
							range: {
								startLineNumber: position.lineNumber,
								startColumn: position.column,
								endLineNumber:
									// Calculate the number of new lines in the completion text and add it to the current line number
									position.lineNumber +
									(newCompletion.match(/\n/g) || []).length,
								// If the suggestion is on the same line, return the length of the completion text
								endColumn: position.column + newCompletion.length,
							},
						};

						// Update the cached suggestions with the new suggestion (up to the cache size limit)
						// Cache size is set to 6 by default, which I found to be a good balance between performance and usability
						setCachedSuggestions((prev) => [...prev, newSuggestion].slice(-6));
					}
				})
				.catch((error) => {
					console.error("error", error);
				});
		}, [monacoRef, complete, selectedFile.name, editorRef]);

		const startOrResetFetching = useCallback(() => {
			// Check if the fetching interval is not already set
			if (fetchSuggestionsIntervalRef.current === undefined) {
				// Immediately invoke suggestions once
				debouncedSuggestions();

				// Set an interval to fetch suggestions every refresh interval
				// (default is 500ms which seems to align will with the
				// average typing speed and latency of OpenAI API calls)
				fetchSuggestionsIntervalRef.current = setInterval(
					debouncedSuggestions,
					refreshInterval,
				) as unknown as number; // Cast to number as setInterval returns a NodeJS.Timeout in Node environments
			}

			// Clear any previous timeout to reset the timer
			clearTimeout(timeoutRef.current);

			// Set a new timeout to stop fetching suggestions if no typing occurs for 2x the refresh interval
			timeoutRef.current = setTimeout(() => {
				if (fetchSuggestionsIntervalRef.current !== undefined) {
					window.clearInterval(fetchSuggestionsIntervalRef.current);
					fetchSuggestionsIntervalRef.current = undefined;
				}
			}, refreshInterval * 2) as unknown as number;
		}, [debouncedSuggestions]);

		// Cleanup on component unmount
		useEffect(() => {
			return () => {
				// Clear the interval and timeout when the component is unmounted
				window.clearInterval(fetchSuggestionsIntervalRef.current);
				window.clearTimeout(timeoutRef.current);
			};
		}, []);

		// Handle editor changes, using debouncing for content updates
		const handleEditorChange = useCallback(
			(value: string) => {
				startOrResetFetching();
				// Use debounced content changes to prevent frequent saving
				if (value) {
					debouncedContentChange(value);
				}
			},
			[startOrResetFetching, debouncedContentChange],
		);

		// setup autocomplete
		useEffect(() => {
			if (!monacoRef.current) return;
			const provider =
				monacoRef.current.languages.registerInlineCompletionsProvider(
					language,
					{
						provideInlineCompletions: async (model, position) => {
							// Filter cached suggestions to include only those that start with the current word at the cursor position
							const suggestions = cachedSuggestions.filter((suggestion) =>
								suggestion.insertText.startsWith(
									model.getValueInRange(suggestion.range),
								),
							);

							// Less restrictive filtering - show suggestions on the current line
							const localSuggestions = suggestions.filter(
								(suggestion) =>
									suggestion.range.startLineNumber === position.lineNumber,
							);

							return {
								items: localSuggestions.map((suggestion) =>
									new CompletionFormatter(model, position).format(
										suggestion.insertText,
										suggestion.range,
									),
								),
							};
						},
						freeInlineCompletions: () => {},
					},
				);

			return () => provider.dispose();
		}, [monacoRef, language, cachedSuggestions]);

		// Update theme when it changes
		useEffect(() => {
			void updateTheme(theme);
		}, [theme, updateTheme]);

		// Setup cmd+k hotkey
		useEffect(() => {
			console.log("Setting up hotkey", {
				editorExists: !!editorRef.current,
				monacoExists: !!monacoRef.current,
			});

			if (!editorRef.current || !monacoRef.current) return;

			const monaco = monacoRef.current;
			const editor = editorRef.current;

			console.log("Registering Cmd+K action");

			// Ensure the editor is focused first
			setTimeout(() => {
				// Focus the editor
				editor.focus();

				// Register cmd+k command
				const disposable = editor.addAction({
					id: "custom-dialog-command",
					label: "Open Custom Dialog",
					keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
					run: () => {
						console.log("Cmd+K triggered!");

						// Get current editor content
						const content = editor.getValue();
						console.log("Editor content length:", content.length);

						// Get current selection
						const selection = editor.getSelection();
						console.log("Selection:", selection);

						let selText = "";
						let selLines = null;

						if (selection && !selection.isEmpty()) {
							selText = editor.getModel()?.getValueInRange(selection) || "";
							selLines = {
								startLineNumber: selection.startLineNumber,
								endLineNumber: selection.endLineNumber,
							};
							console.log("Selected text:", selText);
							console.log("Selected lines:", selLines);
						}

						// Update state to open dialog
						setHighlightedText(selText);
						setSelectedLines(selLines);
						setIsDialogOpen(true);
						console.log("Dialog state set to open:", isDialogOpen);
					},
				});

				// Test if action was registered
				console.log(
					"Registered action:",
					editor.getAction("custom-dialog-command"),
				);

				// Store disposable in ref for cleanup
				return () => {
					console.log("Disposing Cmd+K action");
					disposable.dispose();
				};
			}, 500); // Short delay to ensure everything is loaded
		}, [editorRef, monacoRef, isDialogOpen]);

		// Additional hook to ensure focus when editor content changes
		useEffect(() => {
			if (editorRef.current) {
				editorRef.current.focus();
			}
		}, [editorRef]);

		const handleDialogOpen = () => {
			console.log("Manually opening dialog");
			setIsDialogOpen(true);
		};

		console.log("Dialog state:", {
			isDialogOpen,
			hasHighlightedText: !!highlightedText,
		});

		return (
			<>
				<div className="h-[100vh] w-full">
					<MonacoEditor
						height="100vh"
						language={language}
						value={fileContent || ""}
						theme={theme}
						className="h-full w-full"
						options={{
							readOnly: !isEditing,
							minimap: {
								enabled: true,
								showSlider: "always",
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
							quickSuggestions: true,
							folding: false,
							glyphMargin: false,
							renderValidationDecorations: "editable",
						}}
						onChange={(value) => {
							if (isEditing) {
								handleEditorChange(value || "");
							}
						}}
						onMount={(editor, monaco) => {
							console.log("Monaco editor mounted");
							handleEditorDidMount(editor, monaco);
						}}
					/>
				</div>

				{/* Debug button to manually open dialog */}
				{/* <button
					onClick={handleDialogOpen}
					className="absolute top-4 right-4 rounded bg-blue-500 px-4 py-2 text-white"
					type="button"
				>
					Debug: Open Dialog
				</button> */}

				{/* <CustomDialog
					isOpen={isDialogOpen}
					onClose={() => {
						console.log("Dialog closed");
						setIsDialogOpen(false);
					}}
					editorContent={fileContent || ""}
					highlightedText={highlightedText}
					selectedLines={selectedLines}
				/> */}
			</>
		);
	},
);

MonacoWrapper.displayName = "MonacoWrapper";
