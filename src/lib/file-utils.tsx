import { FileBadge } from "lucide-react";
import Image from "next/image";

// Helper function to get icon for files without extension
const getIconForSpecialFile = (fileName: string) => {
	const lowerFileName = fileName.toLowerCase();

	// Common special files
	switch (fileName) {
		case "LICENSE":
		case "LICENSE.md":
		case "LICENSE.txt":
			return (
				<Image
					src="/icons/certificate.svg"
					alt="License file"
					width={18}
					height={18}
				/>
			);
		case "README":
		case "README.md":
			return (
				<Image
					src="/icons/readme.svg"
					alt="Readme file"
					width={18}
					height={18}
				/>
			);
		case "CHANGELOG":
		case "CHANGELOG.md":
			return (
				<Image
					src="/icons/changelog.svg"
					alt="Changelog file"
					width={18}
					height={18}
				/>
			);
		case "CONTRIBUTING":
		case "CONTRIBUTING.md":
			return (
				<Image
					src="/icons/contributing.svg"
					alt="Contributing file"
					width={18}
					height={18}
				/>
			);
		case "CODE_OF_CONDUCT":
		case "CODE_OF_CONDUCT.md":
			return (
				<Image
					src="/icons/conduct.svg"
					alt="Code of conduct file"
					width={18}
					height={18}
				/>
			);
		case ".env":
		case ".env.local":
		case ".env.development":
		case ".env.production":
		case ".env.example":
			return (
				<Image
					src="/icons/settings.svg"
					alt="Environment file"
					width={18}
					height={18}
				/>
			);
		case ".gitignore":
		case ".gitconfig":
		case ".gitattributes":
			return (
				<Image src="/icons/git.svg" alt="Git file" width={18} height={18} />
			);
		case "package.json":
			return (
				<Image
					src="/icons/nodejs.svg"
					alt="Package file"
					width={18}
					height={18}
				/>
			);
		case "package-lock.json":
		case "yarn.lock":
		case "pnpm-lock.yaml":
			return (
				<Image src="/icons/lock.svg" alt="Lock file" width={18} height={18} />
			);
		case "tsconfig.json":
		case "tsconfig.base.json":
			return (
				<Image
					src="/icons/tsconfig.svg"
					alt="TypeScript config"
					width={18}
					height={18}
				/>
			);
		case "next.config.js":
		case "next.config.mjs":
			return (
				<Image
					src="/icons/next.svg"
					alt="Next.js config"
					width={18}
					height={18}
				/>
			);
		case "vite.config.ts":
		case "vite.config.js":
			return (
				<Image src="/icons/vite.svg" alt="Vite config" width={18} height={18} />
			);
		case "tailwind.config.js":
		case "tailwind.config.ts":
			return (
				<Image
					src="/icons/tailwindcss.svg"
					alt="Tailwind config"
					width={18}
					height={18}
				/>
			);
		case "postcss.config.js":
			return (
				<Image
					src="/icons/postcss.svg"
					alt="PostCSS config"
					width={18}
					height={18}
				/>
			);
		case "prettier.config.js":
		case ".prettierrc":
		case ".prettierrc.json":
		case ".prettierrc.js":
			return (
				<Image
					src="/icons/prettier.svg"
					alt="Prettier config"
					width={18}
					height={18}
				/>
			);
		case "eslint.config.js":
		case ".eslintrc":
		case ".eslintrc.js":
		case ".eslintrc.json":
			return (
				<Image
					src="/icons/eslint.svg"
					alt="ESLint config"
					width={18}
					height={18}
				/>
			);
		case "jest.config.js":
		case "jest.config.ts":
			return (
				<Image src="/icons/jest.svg" alt="Jest config" width={18} height={18} />
			);
		case "vitest.config.ts":
		case "vitest.config.js":
			return (
				<Image
					src="/icons/vitest.svg"
					alt="Vitest config"
					width={18}
					height={18}
				/>
			);
		case "Dockerfile":
			return (
				<Image
					src="/icons/docker.svg"
					alt="Dockerfile"
					width={18}
					height={18}
				/>
			);
		case "docker-compose.yml":
		case "docker-compose.yaml":
			return (
				<Image
					src="/icons/docker.svg"
					alt="Docker Compose"
					width={18}
					height={18}
				/>
			);
		case "Makefile":
			return (
				<Image
					src="/icons/makefile.svg"
					alt="Makefile"
					width={18}
					height={18}
				/>
			);
		default:
			if (lowerFileName.includes("dockerfile")) {
				return (
					<Image
						src="/icons/docker.svg"
						alt="Docker file"
						width={18}
						height={18}
					/>
				);
			}
			return null;
	}
};

// Get file icon based on extension
export const getFileIcon = (fileName: string) => {
	// First check for special files without extensions or with specific names
	const specialFileIcon = getIconForSpecialFile(fileName);
	if (specialFileIcon) {
		return specialFileIcon;
	}

	const ext = fileName.split(".").pop()?.toLowerCase();

	// Then try to match with available icon in the public/icons directory
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
		case "mjs":
		case "cjs":
			return (
				<Image
					src="/icons/javascript.svg"
					alt="JavaScript module"
					width={18}
					height={18}
				/>
			);
		case "d.ts":
			return (
				<Image
					src="/icons/typescript-def.svg"
					alt="TypeScript definition"
					width={18}
					height={18}
				/>
			);

		// Web files
		case "html":
		case "htm":
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
		case "less":
			return (
				<Image src="/icons/less.svg" alt="Less file" width={18} height={18} />
			);
		case "styl":
			return (
				<Image
					src="/icons/stylus.svg"
					alt="Stylus file"
					width={18}
					height={18}
				/>
			);
		case "postcss":
			return (
				<Image
					src="/icons/postcss.svg"
					alt="PostCSS file"
					width={18}
					height={18}
				/>
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
		case "ini":
		case "conf":
		case "config":
			return (
				<Image
					src="/icons/settings.svg"
					alt="Config file"
					width={18}
					height={18}
				/>
			);

		// Documentation
		case "md":
		case "mdx":
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
		case "pdf":
			return (
				<Image src="/icons/pdf.svg" alt="PDF file" width={18} height={18} />
			);
		case "doc":
		case "docx":
			return (
				<Image src="/icons/word.svg" alt="Word file" width={18} height={18} />
			);
		case "xls":
		case "xlsx":
			return (
				<Image src="/icons/table.svg" alt="Excel file" width={18} height={18} />
			);
		case "ppt":
		case "pptx":
			return (
				<Image
					src="/icons/powerpoint.svg"
					alt="PowerPoint file"
					width={18}
					height={18}
				/>
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
		case "bmp":
		case "ico":
		case "webp":
			return (
				<Image
					src="/icons/image.svg"
					alt="Image file"
					width={18}
					height={18}
					className="text-primary"
				/>
			);

		// Media
		case "mp3":
		case "wav":
		case "ogg":
		case "flac":
			return (
				<Image src="/icons/audio.svg" alt="Audio file" width={18} height={18} />
			);
		case "mp4":
		case "webm":
		case "mkv":
		case "avi":
		case "mov":
			return (
				<Image src="/icons/video.svg" alt="Video file" width={18} height={18} />
			);

		// Archives
		case "zip":
		case "rar":
		case "7z":
		case "tar":
		case "gz":
			return (
				<Image src="/icons/zip.svg" alt="Archive file" width={18} height={18} />
			);

		// Languages
		case "go":
		case "mod":
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
		case "class":
		case "jar":
			return (
				<Image src="/icons/java.svg" alt="Java file" width={18} height={18} />
			);
		case "c":
			return <Image src="/icons/c.svg" alt="C file" width={18} height={18} />;
		case "h":
			return (
				<Image src="/icons/h.svg" alt="Header file" width={18} height={18} />
			);
		case "cpp":
		case "cc":
		case "cxx":
			return (
				<Image src="/icons/cpp.svg" alt="C++ file" width={18} height={18} />
			);
		case "hpp":
		case "hxx":
			return (
				<Image
					src="/icons/hpp.svg"
					alt="C++ Header file"
					width={18}
					height={18}
				/>
			);
		case "cs":
			return (
				<Image src="/icons/csharp.svg" alt="C# file" width={18} height={18} />
			);
		case "sh":
		case "bash":
		case "zsh":
		case "fish":
		case "ksh":
		case "csh":
		case "tcsh":
		case "ps1": // PowerShell
		case "psm1": // PowerShell module
		case "psd1": // PowerShell data
			return (
				<Image
					src="/icons/exe.svg"
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
		case "svelte":
			return (
				<Image
					src="/icons/svelte.svg"
					alt="Svelte file"
					width={18}
					height={18}
				/>
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
		case "gql":
			return (
				<Image
					src="/icons/graphql.svg"
					alt="GraphQL file"
					width={18}
					height={18}
				/>
			);
		case "tf":
		case "tfvars":
		case "hcl":
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
		case "xaml":
			return (
				<Image src="/icons/xml.svg" alt="XML file" width={18} height={18} />
			);
		case "swift":
			return (
				<Image src="/icons/swift.svg" alt="Swift file" width={18} height={18} />
			);
		case "kt":
		case "kts":
			return (
				<Image
					src="/icons/kotlin.svg"
					alt="Kotlin file"
					width={18}
					height={18}
				/>
			);
		case "dart":
			return (
				<Image src="/icons/dart.svg" alt="Dart file" width={18} height={18} />
			);
		case "ex":
		case "exs":
			return (
				<Image
					src="/icons/elixir.svg"
					alt="Elixir file"
					width={18}
					height={18}
				/>
			);
		case "elm":
			return (
				<Image src="/icons/elm.svg" alt="Elm file" width={18} height={18} />
			);
		case "erl":
			return (
				<Image
					src="/icons/erlang.svg"
					alt="Erlang file"
					width={18}
					height={18}
				/>
			);
		case "fs":
		case "fsx":
			return (
				<Image src="/icons/fsharp.svg" alt="F# file" width={18} height={18} />
			);
		case "hs":
			return (
				<Image
					src="/icons/haskell.svg"
					alt="Haskell file"
					width={18}
					height={18}
				/>
			);
		case "lua":
			return (
				<Image src="/icons/lua.svg" alt="Lua file" width={18} height={18} />
			);
		case "r":
			return <Image src="/icons/r.svg" alt="R file" width={18} height={18} />;
		case "scala":
			return (
				<Image src="/icons/scala.svg" alt="Scala file" width={18} height={18} />
			);
		case "pl":
		case "pm":
			return (
				<Image src="/icons/perl.svg" alt="Perl file" width={18} height={18} />
			);
		case "rkt":
			return (
				<Image
					src="/icons/racket.svg"
					alt="Racket file"
					width={18}
					height={18}
				/>
			);
		case "clj":
		case "cljs":
			return (
				<Image
					src="/icons/clojure.svg"
					alt="Clojure file"
					width={18}
					height={18}
				/>
			);
		case "vim":
			return (
				<Image src="/icons/vim.svg" alt="Vim file" width={18} height={18} />
			);
		case "astro":
			return (
				<Image src="/icons/astro.svg" alt="Astro file" width={18} height={18} />
			);

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
		// Documentation
		"txt",
		"md",
		"mdx",
		"rst",
		"tex",
		"adoc",
		"asc",
		"asciidoc",

		// Web
		"html",
		"htm",
		"xhtml",
		"css",
		"scss",
		"sass",
		"less",
		"styl",
		"js",
		"jsx",
		"ts",
		"tsx",
		"mjs",
		"cjs",
		"json",
		"jsonc",
		"vue",
		"svelte",
		"astro",

		// Config
		"toml",
		"yml",
		"yaml",
		"xml",
		"ini",
		"conf",
		"config",
		"env",
		"properties",
		"prop",
		"cfg",

		// Programming Languages
		"py",
		"rb",
		"php",
		"java",
		"kt",
		"kts",
		"c",
		"h",
		"cpp",
		"hpp",
		"cc",
		"cxx",
		"hxx",
		"cs",
		"fs",
		"fsx",
		"go",
		"rs",
		"swift",
		"sh",
		"bash",
		"zsh",
		"fish",
		"lua",
		"tcl",
		"pl",
		"pm",
		"t",
		"r",
		"scala",
		"groovy",
		"dart",
		"ex",
		"exs",
		"erl",
		"hrl",
		"elm",
		"hs",
		"lhs",
		"rkt",
		"clj",
		"cljs",
		"vim",
		"sql",
		"graphql",
		"gql",

		// Build/Config
		"Dockerfile",
		"docker-compose.yml",
		"docker-compose.yaml",
		"Makefile",
		"cmake",
		"ninja",
		"gradle",
		"pom",
		"ivy",

		// Version Control
		"gitignore",
		"gitattributes",
		"gitmodules",

		// Lock files
		"lock",
		"lockfile",

		// Other
		"log",
		"diff",
		"patch",
	];

	// First check for special files without extensions
	const specialFiles = [
		"LICENSE",
		"README",
		"CHANGELOG",
		"CONTRIBUTING",
		"CODE_OF_CONDUCT",
		"AUTHORS",
		"MAINTAINERS",
		"Dockerfile",
		"Makefile",
		"Vagrantfile",
		".env",
		".gitignore",
		".prettierrc",
		".eslintrc",
	];

	if (specialFiles.includes(fileName)) {
		return true;
	}

	const ext = fileName.split(".").pop()?.toLowerCase();
	return textExtensions.includes(ext || "");
};

// Get folder icon based on state and name
export const getFolderIcon = (isOpen: boolean, folderName?: string) => {
	// Use default 'other' icon if no name provided
	if (!folderName) {
		return isOpen ? (
			<Image
				src="/icons/folder-other-open.svg"
				alt="Open folder"
				width={18}
				height={18}
				className="text-amber-500"
			/>
		) : (
			<Image
				src="/icons/folder-other.svg"
				alt="Folder"
				width={18}
				height={18}
				className="text-amber-500"
			/>
		);
	}

	const name = folderName.toLowerCase();

	// List derived from the ls command output
	const specialFolders = [
		"admin",
		"android",
		"angular",
		"animation",
		"ansible",
		"api",
		"apollo",
		"app",
		"archive",
		"astro",
		"audio",
		"aurelia",
		"aws",
		"azure-pipelines",
		"base",
		"batch",
		"benchmark",
		"bicep",
		"bloc",
		"bower",
		"buildkite",
		"cart",
		"changesets",
		"ci",
		"circleci",
		"class",
		"client",
		"cline",
		"cloud-functions",
		"cloudflare",
		"cluster",
		"cobol",
		"command",
		"components",
		"config",
		"connection",
		"console",
		"constant",
		"container",
		"content",
		"context",
		"contract",
		"controller",
		"core",
		"coverage",
		"css",
		"custom",
		"cypress",
		"dart",
		"database",
		"debug",
		"decorators",
		"delta",
		"desktop",
		"directive",
		"dist",
		"docker",
		"docs",
		"download",
		"drizzle",
		"dump",
		"element",
		"enum",
		"environment",
		"error",
		"event",
		"examples",
		"expo",
		"export",
		"fastlane",
		"favicon",
		"firebase",
		"firestore",
		"flow",
		"flutter",
		"font",
		"forgejo",
		"functions",
		"gamemaker",
		"generator",
		"gh-workflows",
		"git",
		"gitea",
		"github",
		"gitlab",
		"global",
		"godot",
		"gradle",
		"graphql",
		"guard",
		"gulp",
		"helm",
		"helper",
		"home",
		"hook",
		"husky",
		"i18n",
		"images",
		"import",
		"include",
		"intellij",
		"interface",
		"ios",
		"java",
		"javascript",
		"jinja",
		"job",
		"json",
		"jupyter",
		"keys",
		"kubernetes",
		"kusto",
		"layout",
		"lefthook",
		"less",
		"lib",
		"linux",
		"liquibase",
		"log",
		"lottie",
		"lua",
		"luau",
		"macos",
		"mail",
		"mappings",
		"markdown",
		"mercurial",
		"messages",
		"meta",
		"middleware",
		"mjml",
		"mobile",
		"mock",
		"mojo",
		"moon",
		"netlify",
		"next",
		"ngrx-store",
		"node",
		"nuxt",
		"obsidian",
		"other",
		"packages",
		"pdf",
		"pdm",
		"php",
		"phpmailer",
		"pipe",
		"plastic",
		"plugin",
		"policy",
		"powershell",
		"prisma",
		"private",
		"project",
		"proto",
		"public",
		"python",
		"quasar",
		"queue",
		"react-components",
		"redux-reducer",
		"repository",
		"resolver",
		"resource",
		"review",
		"robot",
		"routes",
		"rules",
		"rust",
		"sandbox",
		"sass",
		"scala",
		"scons",
		"scripts",
		"secure",
		"seeders",
		"server",
		"serverless",
		"shader",
		"shared",
		"snapcraft",
		"snippet",
		"src",
		"src-tauri",
		"stack",
		"stencil",
		"store",
		"storybook",
		"stylus",
		"sublime",
		"supabase",
		"svelte",
		"svg",
		"syntax",
		"target",
		"taskfile",
		"tasks",
		"television",
		"temp",
		"template",
		"terraform",
		"test",
		"theme",
		"tools",
		"trash",
		"turborepo",
		"typescript",
		"ui",
		"unity",
		"update",
		"upload",
		"utils",
		"vercel",
		"verdaccio",
		"video",
		"views",
		"vm",
		"vscode",
		"vue-directives",
		"vue",
		"vuepress",
		"vuex-store",
		"wakatime",
		"webpack",
		"windows",
		"wordpress",
		"yarn",
		"zeabur",
	];

	// Check if folder name exactly matches one of our special folders
	if (specialFolders.includes(name)) {
		const iconPath = `/icons/folder-${name}${isOpen ? "-open" : ""}.svg`;
		const altText = `${isOpen ? "Open " : ""}${folderName} folder`;
		// NOTE: We assume the corresponding open/closed icon exists based on the ls output
		// A more robust solution might check file existence, but this is simpler for now.
		return (
			<Image
				src={iconPath}
				alt={altText}
				width={18}
				height={18}
				className="text-amber-500"
			/>
		);
	}

	// Default folder icon for non-special folders (using 'other')
	return isOpen ? (
		<Image
			src="/icons/folder-other-open.svg"
			alt="Open folder"
			width={18}
			height={18}
			className="text-amber-500"
		/>
	) : (
		<Image
			src="/icons/folder-other.svg"
			alt="Folder"
			width={18}
			height={18}
			className="text-amber-500"
		/>
	);
};
