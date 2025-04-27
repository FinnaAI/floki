const languageMap: Record<string, string> = {
	js: "javascript",
	jsx: "javascript",
	ts: "typescript",
	tsx: "typescript",
	html: "html",
	css: "css",
	scss: "scss",
	json: "json",
	md: "markdown",
	py: "python",
	rb: "ruby",
	java: "java",
	c: "c",
	cpp: "cpp",
	cs: "csharp",
	go: "go",
	php: "php",
	rs: "rust",
	swift: "swift",
	sh: "shell",
	yml: "yaml",
	yaml: "yaml",
	xml: "xml",
	sql: "sql",
	graphql: "graphql",
	kt: "kotlin",
	dart: "dart",
};

export const getLanguageFromFileName = (fileName: string): string => {
	const ext = fileName.split(".").pop()?.toLowerCase() || "";
	return languageMap[ext] || "plaintext";
};
