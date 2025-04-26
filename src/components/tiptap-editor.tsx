"use client";

import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
interface TiptapViewerProps {
	content: string;
	className?: string;
}

const TiptapViewer = ({ content, className }: TiptapViewerProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
				paragraph: {
					HTMLAttributes: {
						class: "mb-4",
					},
				},
			}),
			Document,
			Paragraph,
			Text,
		],
		content: marked.parse(content),

		editable: false,
		editorProps: {
			attributes: {
				class: "",
			},
		},
	});

	return <EditorContent editor={editor} className={className} />;
};

export { TiptapViewer };
