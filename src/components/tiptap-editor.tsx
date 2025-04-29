"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";

interface TiptapViewerProps {
	content: string;
	className?: string;
}

const TiptapViewer = ({ content, className }: TiptapViewerProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3, 4, 5, 6],
				},
				paragraph: {
					HTMLAttributes: {
						class: "mb-4",
					},
				},
			}),
			Markdown.configure({
				html: true,
				transformPastedText: true,
				transformCopiedText: true,
				breaks: true,
			}),
		],
		content: content,
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
