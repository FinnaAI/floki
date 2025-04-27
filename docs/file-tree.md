# File Tree Component

The File Tree component is a complex UI component that provides a hierarchical view of files and directories, with support for file operations like creating, renaming, and deleting files and folders. It integrates with Git status to show file modifications and supports file selection and search functionality.

## Features

- File and folder navigation
- File/folder creation, renaming, and deletion
- Git status integration (modified, added, deleted files)
- File search functionality
- Multi-file selection
- Drag and drop support (coming soon)
- Context menus for file operations
- Permission handling for file system access

## Component Structure

The component is split into several smaller components for better maintainability:

```
components/file-tree/
├── index.tsx (exports)
├── file-tree.tsx (main component)
├── components/
│   ├── loading-state.tsx
│   ├── permission-request.tsx
│   ├── error-state.tsx
│   ├── empty-state.tsx
│   ├── file-list.tsx
│   ├── directory-node.tsx
│   ├── file-node.tsx
│   └── inline-editor.tsx
├── hooks/
│   └── use-file-tree.ts
└── types/
    └── index.ts
```

## State Management

The component uses several Zustand stores for state management:

- **FileStore**: Manages file system operations and state
- **FileTreeStore**: Manages file tree UI state (search, filtering)
- **GitStatusStore**: Manages Git integration and file status
- **IDEStore**: Manages IDE-level state (active project, theme, etc.)

## Usage

```tsx
import { FileTree } from "@/components/file-tree";

export default function MyComponent() {
  return (
    <div className="h-screen w-64">
      <FileTree />
    </div>
  );
}
```

## Components

### FileTree

The main component that orchestrates all the sub-components and manages the overall state.

### FileList

Renders the list of files and directories, handling the root level items and their organization.

### DirectoryNode

Handles the rendering and interaction of directory items, including:
- Expansion/collapse
- Context menu actions
- File/folder creation within directories
- Renaming
- Deletion

### FileNode

Handles the rendering and interaction of file items, including:
- Selection
- Context menu actions
- Renaming
- Deletion
- Git status indicators

### InlineEditor

A reusable component for inline editing of file/folder names.

### State Components

- **LoadingState**: Shows loading spinner while fetching directory contents
- **PermissionRequest**: Handles file system permission requests
- **ErrorState**: Displays error messages
- **EmptyState**: Shows when a directory is empty or search yields no results

## Hooks

### useFileTree

A custom hook that encapsulates all the file tree logic and state management. It provides:

- File system operations
- State management
- Event handlers
- Git status integration

## Types

The component uses TypeScript for type safety. Key types include:

- `FileInfo`: Represents file/directory information
- `DirectoryNodeProps`: Props for directory components
- `FileNodeProps`: Props for file components
- `FileListProps`: Props for the file list component

## Store Integration

### FileStore
- Handles file system operations
- Manages file selection
- Handles directory navigation
- Manages file system permissions

### FileTreeStore
- Manages search state
- Handles filtered file list
- Manages UI-specific state

### GitStatusStore
- Tracks file modifications
- Provides Git status information
- Handles ignored files

### IDEStore
- Manages active project
- Handles theme settings
- Manages IDE-level state

## Styling

The component uses Tailwind CSS for styling and supports:
- Dark/light themes
- Responsive design
- Custom color schemes
- Hover and active states
- Animations for loading and transitions

## Future Improvements

1. Drag and drop support for file/folder organization
2. File preview on hover
3. Custom file type icons
4. Improved search with fuzzy matching
5. File/folder favorites
6. Custom context menu actions
7. Keyboard navigation
8. File/folder permissions management
9. Bulk operations
10. Undo/redo support for file operations

## Contributing

When contributing to the file tree component:

1. Follow the existing component structure
2. Maintain type safety with TypeScript
3. Add tests for new functionality
4. Update documentation for significant changes
5. Follow the established styling patterns
6. Consider performance implications
7. Maintain accessibility standards 