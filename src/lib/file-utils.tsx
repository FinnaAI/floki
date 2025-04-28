import { FileBadge } from "lucide-react";
import Image from "next/image";

// Get file icon based on extension
export const getFileIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase();

	// First try to match with available icon in the public/icons directory
	switch (ext) {
		// JavaScript/TypeScript files
		case "js":
			return (
				<Image
					src="/icons/javascript.svg"
					alt="JavaScript file"
					width={18}
					height={18}
				/>
			);
		case "jsx":
			return (
				<Image
					src="/icons/react.svg"
					alt="React JSX file"
					width={18}
					height={18}
				/>
			);
		case "ts":
			return (
				<Image
					src="/icons/typescript.svg"
					alt="TypeScript file"
					width={18}
					height={18}
				/>
			);
		case "tsx":
			return (
				<Image
					src="/icons/react.svg"
					alt="React TSX file"
					width={18}
					height={18}
				/>
			);

		// Web files
		case "html":
			return (
				<Image src="/icons/html.svg" alt="HTML file" width={18} height={18} />
			);
		case "css":
			return (
				<Image src="/icons/css.svg" alt="CSS file" width={18} height={18} />
			);
		case "scss":
		case "sass":
			return (
				<Image src="/icons/sass.svg" alt="SASS file" width={18} height={18} />
			);

		// Config files
		case "json":
		case "jsonc":
			return (
				<Image src="/icons/json.svg" alt="JSON file" width={18} height={18} />
			);
		case "yml":
		case "yaml":
			return (
				<Image src="/icons/yaml.svg" alt="YAML file" width={18} height={18} />
			);
		case "toml":
			return (
				<Image src="/icons/toml.svg" alt="TOML file" width={18} height={18} />
			);

		// Documentation
		case "md":
			return (
				<Image
					src="/icons/markdown.svg"
					alt="Markdown file"
					width={18}
					height={18}
				/>
			);
		case "txt":
			return (
				<Image src="/icons/font.svg" alt="Text file" width={18} height={18} />
			);

		// Images
		case "svg":
			return (
				<Image src="/icons/svg.svg" alt="SVG file" width={18} height={18} />
			);
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
			return (
				<Image
					src="/icons/image.svg"
					alt="Image file"
					width={18}
					height={18}
					className="text-primary"
				/>
			);

		// Languages
		case "go":
			return <Image src="/icons/go.svg" alt="Go file" width={18} height={18} />;
		case "py":
			return (
				<Image
					src="/icons/python.svg"
					alt="Python file"
					width={18}
					height={18}
				/>
			);
		case "rb":
			return (
				<Image src="/icons/ruby.svg" alt="Ruby file" width={18} height={18} />
			);
		case "php":
			return (
				<Image src="/icons/php.svg" alt="PHP file" width={18} height={18} />
			);
		case "java":
			return (
				<Image src="/icons/java.svg" alt="Java file" width={18} height={18} />
			);
		case "c":
			return <Image src="/icons/c.svg" alt="C file" width={18} height={18} />;
		case "cpp":
			return (
				<Image src="/icons/cpp.svg" alt="C++ file" width={18} height={18} />
			);
		case "sh":
		case "bash":
			return (
				<Image
					src="/icons/command.svg"
					alt="Shell script"
					width={18}
					height={18}
				/>
			);
		case "rs":
			return (
				<Image src="/icons/rust.svg" alt="Rust file" width={18} height={18} />
			);
		case "vue":
			return (
				<Image src="/icons/vue.svg" alt="Vue file" width={18} height={18} />
			);
		case "prisma":
			return (
				<Image
					src="/icons/prisma.svg"
					alt="Prisma file"
					width={18}
					height={18}
				/>
			);
		case "graphql":
			return (
				<Image
					src="/icons/graphql.svg"
					alt="GraphQL file"
					width={18}
					height={18}
				/>
			);
		case "docker":
		case "dockerfile":
			return (
				<Image
					src="/icons/docker.svg"
					alt="Docker file"
					width={18}
					height={18}
				/>
			);
		case "terraform":
		case "tf":
			return (
				<Image
					src="/icons/terraform.svg"
					alt="Terraform file"
					width={18}
					height={18}
				/>
			);
		case "sql":
			return (
				<Image
					src="/icons/database.svg"
					alt="SQL file"
					width={18}
					height={18}
				/>
			);
		case "xml":
			return (
				<Image src="/icons/xml.svg" alt="XML file" width={18} height={18} />
			);
		case "swift":
			return (
				<Image src="/icons/swift.svg" alt="Swift file" width={18} height={18} />
			);
		case "env":
			return (
				<Image src="/icons/settings.svg" alt="Settings file" width={18} height={18} />
			);
		case "gitignore":
			return (
				<Image src="/icons/git.svg" alt="Git file" width={18} height={18} />
			);
		case "gitconfig":
			return (
				<Image src="/icons/git.svg" alt="Git config file" width={18} height={18} />
			);
		case "gitattributes":
			return (
				<Image src="/icons/git.svg" alt="Git attributes file" width={18} height={18} />
			);
		case "LICENSE":
			return (
				<Image src="/icons/license.svg" alt="License file" width={18} height={18} />
			);
		case "README":
			return <Image src="/icons/readme.svg" alt="Readme file" width={18} height={18} />;
		case "CONTRIBUTING":
			return <Image src="/icons/readme.svg" alt="Contributing file" width={18} height={18} />;
		case "CHANGELOG":
			return <Image src="/icons/readme.svg" alt="Changelog file" width={18} height={18} />;
		case "CODE_OF_CONDUCT":
			return <Image src="/icons/readme.svg" alt="Code of conduct file" width={18} height={18} />;
		case "ISSUE_TEMPLATE":
			return <Image src="/icons/readme.svg" alt="Issue template file" width={18} height={18} />;
		case "PULL_REQUEST_TEMPLATE":
			return <Image src="/icons/readme.svg" alt="Pull request template file" width={18} height={18} />;
		
		
		
		// Fallback to Lucide icons for types without matching SVG icons
		default:
			return <FileBadge size={18} />;
	}
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

// Format date for display
export const formatDate = (date: Date): string => {
	const now = new Date();
	const dateObj = new Date(date);

	// If it's today, show time only
	if (dateObj.toDateString() === now.toDateString()) {
		return dateObj.toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	// If it's this year, show month and day
	if (dateObj.getFullYear() === now.getFullYear()) {
		return dateObj.toLocaleDateString([], { month: "short", day: "numeric" });
	}

	// Otherwise show date with year
	return dateObj.toLocaleDateString([], {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

// Is this a text file that can be displayed?
export const isTextFile = (fileName: string) => {
	const textExtensions = [
		"txt",
		"md",
		"js",
		"jsx",
		"ts",
		"tsx",
		"css",
		"scss",
		"html",
		"json",
		"jsonc",
		"toml",
		"yml",
		"yaml",
		"xml",
		"svg",
		"py",
		"rb",
		"sh",
		"bash",
		"c",
		"cpp",
		"h",
		"java",
		"php",
		"go",
		"rust",
		"fs",
	];
	const ext = fileName.split(".").pop()?.toLowerCase();
	return textExtensions.includes(ext || "");
};
