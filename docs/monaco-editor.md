# Monaco Editor Component

The Monaco Editor component is a powerful code editor implementation that provides features like syntax highlighting, code completion, and diff viewing. This document explains how to use the component in your application.

## Basic Usage

```tsx
import { FileMonacoEditor } from "@/components/editor/file-monaco-editor";

function MyComponent() {
  return (
    <FileMonacoEditor
      selectedFile={{
        name: "example.ts",
        path: "/example.ts",
        isDirectory: false,
        size: 100,
        lastModified: new Date(),
      }}
      fileContent="// Your code here"
      loading={false}
      error={null}
    />
  );
}
```

## Features

### Theme Support

The editor supports multiple themes that can be switched at runtime. Themes are loaded dynamically and cached for better performance.

```tsx
import { useIDEStore } from "@/store/ide-store";

function MyComponent() {
  const { setEditorTheme } = useIDEStore();

  // Switch theme
  const handleThemeChange = (theme: string) => {
    setEditorTheme(theme);
  };
}
```

### Git Integration

The editor supports displaying git status and file diffs:

```tsx
<FileMonacoEditor
  selectedFile={file}
  fileContent={content}
  gitStatus={{
    modified: ["/example.ts"],
    added: [],
    untracked: [],
    deleted: [],
    ignored: [],
  }}
/>
```

### Image Support

The component automatically handles image files by displaying them in an image viewer instead of the code editor:

```tsx
<FileMonacoEditor
  selectedFile={{
    name: "example.png",
    path: "/example.png",
    isDirectory: false,
    size: 1000,
    lastModified: new Date(),
  }}
  fileContent="data:image/png;base64,..."
/>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| selectedFile | FileInfo \| null | The currently selected file |
| fileContent | string \| null | The content of the file |
| fileDiff | FileDiff \| null | Git diff information |
| loading | boolean | Loading state |
| error | string \| null | Error message |
| gitStatus | GitStatus \| null | Git status information |
| currentPath | string | Current workspace path |
| onFileContentChange | (content: string) => void | Callback for content changes |

## State Management

The editor uses Zustand for state management. The IDE store handles:

- Theme management
- Editor preferences
- File selection
- Project management

```tsx
import { useIDEStore } from "@/store/ide-store";

// Access store
const {
  editorTheme,
  setEditorTheme,
  addMonacoTheme,
  isThemeLoaded,
} = useIDEStore();
```

## Performance Optimizations

1. Theme caching:
   - Themes are loaded once and cached in the store
   - Subsequent theme switches are instant

2. Editor instance management:
   - Editor instances are properly cleaned up
   - Settings are optimized for performance

3. Diff viewing:
   - Diff content is loaded on demand
   - Uses efficient diff algorithm

## Testing

The component includes:

1. Unit tests:
   ```bash
   pnpm test
   ```

2. Integration tests:
   ```bash
   pnpm test:integration
   ```

3. E2E tests:
   ```bash
   pnpm test:e2e
   ```

4. Visual regression tests:
   ```bash
   pnpm test:visual
   ```

## Best Practices

1. Theme Management:
   - Use the IDE store for theme switching
   - Preload commonly used themes

2. File Handling:
   - Check file type before loading
   - Handle large files appropriately

3. Git Integration:
   - Keep diff view updated
   - Handle git status changes

4. Error Handling:
   - Display meaningful error messages
   - Fallback gracefully

## Example: Custom Theme

```tsx
const customTheme = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "6A9955" },
    { token: "keyword", foreground: "569CD6" },
  ],
  colors: {
    "editor.background": "#1E1E1E",
    "editor.foreground": "#D4D4D4",
  },
};

// Add custom theme
useIDEStore.getState().addMonacoTheme("custom-theme", customTheme);
```

## Example: File Diff

```tsx
<FileMonacoEditor
  selectedFile={file}
  fileContent={content}
  fileDiff={{
    oldContent: "// Old code",
    newContent: "// New code",
    hunks: [{
      oldStart: 1,
      oldLines: 1,
      newStart: 1,
      newLines: 1,
      lines: ["-// Old code", "+// New code"],
    }],
  }}
/>
```

## Troubleshooting

Common issues and solutions:

1. Theme not loading:
   - Check theme file exists
   - Verify theme format
   - Check network requests

2. Editor performance:
   - Reduce minimap size
   - Disable unnecessary features
   - Use appropriate word wrap settings

3. Git diff issues:
   - Verify git status
   - Check file permissions
   - Validate diff format

## References

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Testing Library Documentation](https://testing-library.com/docs/)
