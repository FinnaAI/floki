import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, expect, vi } from "vitest";

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Declare the matchers globally
declare module "vitest" {
	interface Assertion<T> {
		toBeInTheDocument(): void;
		toHaveTextContent(text: string): void;
	}
}

// Mock Monaco Editor
vi.mock("@monaco-editor/react", () => ({
	default: () =>
		React.createElement("div", { "data-testid": "monaco-editor" }, null),
	DiffEditor: () =>
		React.createElement("div", { "data-testid": "diff-editor" }, null),
}));

// Mock Radix UI components
vi.mock("@radix-ui/react-select", () => ({
	Root: ({
		children,
		value,
		onValueChange,
	}: {
		children: React.ReactNode;
		value?: string;
		onValueChange?: (value: string) => void;
	}) => React.createElement("div", { "data-testid": "select" }, children),
	Trigger: ({ children }: { children: React.ReactNode }) =>
		React.createElement(
			"button",
			{ "data-testid": "select-trigger", type: "button" },
			children,
		),
	Value: ({ children }: { children: React.ReactNode }) =>
		React.createElement("span", { "data-testid": "select-value" }, children),
	Content: ({ children }: { children: React.ReactNode }) =>
		React.createElement("div", { "data-testid": "select-content" }, children),
	Item: ({ children, value }: { children: React.ReactNode; value: string }) =>
		React.createElement(
			"div",
			{ "data-testid": "select-item", "data-value": value },
			children,
		),
	Icon: ({ children }: { children: React.ReactNode }) =>
		React.createElement("span", { "data-testid": "select-icon" }, children),
}));

vi.mock("@/components/ui/select", () => ({
	Select: ({
		children,
		value,
		onValueChange,
	}: {
		children: React.ReactNode;
		value?: string;
		onValueChange?: (value: string) => void;
	}) => React.createElement("div", { "data-testid": "select" }, children),
	SelectTrigger: ({ children }: { children: React.ReactNode }) =>
		React.createElement(
			"button",
			{ "data-testid": "select-trigger", type: "button" },
			children,
		),
	SelectValue: ({ children }: { children: React.ReactNode }) =>
		React.createElement("span", { "data-testid": "select-value" }, children),
	SelectContent: ({ children }: { children: React.ReactNode }) =>
		React.createElement("div", { "data-testid": "select-content" }, children),
	SelectItem: ({
		children,
		value,
	}: { children: React.ReactNode; value: string }) =>
		React.createElement(
			"div",
			{ "data-testid": `select-item-${value}`, "data-value": value },
			children,
		),
}));

vi.mock("@/components/ui/breadcrumb", () => ({
	Breadcrumb: vi.fn(({ children }) =>
		React.createElement("nav", { "data-testid": "breadcrumb" }, children),
	),
	BreadcrumbList: vi.fn(({ children }) =>
		React.createElement("ol", { "data-testid": "breadcrumb-list" }, children),
	),
	BreadcrumbItem: vi.fn(({ children }) =>
		React.createElement("li", { "data-testid": "breadcrumb-item" }, children),
	),
	BreadcrumbLink: vi.fn(({ children }) =>
		React.createElement(
			"a",
			{ "data-testid": "breadcrumb-link", href: "#" },
			children,
		),
	),
	BreadcrumbPage: vi.fn(({ children }) =>
		React.createElement("span", { "data-testid": "breadcrumb-page" }, children),
	),
	BreadcrumbSeparator: vi.fn(() =>
		React.createElement("span", { "data-testid": "breadcrumb-separator" }, "/"),
	),
}));

vi.mock("@/components/ui/scroll-area", () => ({
	ScrollArea: vi.fn(({ children }) =>
		React.createElement("div", { "data-testid": "scroll-area" }, children),
	),
}));

vi.mock("@/components/ui/badge", () => ({
	Badge: vi.fn(({ children, variant, className }) =>
		React.createElement(
			"span",
			{
				"data-testid": "badge",
				"data-variant": variant,
				className,
			},
			children,
		),
	),
}));

// Mock fetch for theme loading
global.fetch = vi.fn(() =>
	Promise.resolve({
		json: () => Promise.resolve(["vs-dark", "vs-light"]),
	} as Response),
);

// Mock Next.js Image component
vi.mock("next/image", () => ({
	default: ({ alt, src, ...props }: { alt: string; src: string }) =>
		React.createElement("img", {
			alt,
			src,
			"data-testid": "next-image",
			...props,
		}),
}));

// Clean up after each test
afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});
