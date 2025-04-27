# Testing Guide

## Setup

We use the following testing stack:
- Vitest - Test runner
- React Testing Library - Component testing
- Custom test utilities in `src/test-utils.tsx`

## Commands

```bash
# Run tests in watch mode (development)
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Project Structure

```
src/
  __tests__/            # Global test files
  components/
    __tests__/          # Component-specific tests
  store/
    __tests__/          # Store tests
  interfaces/
    __tests__/          # Interface tests
```

## Testing Patterns

### 1. Zustand Store Testing

Example from [src/store/__tests__/file-tree-store.test.ts](mdc:src/store/__tests__/file-tree-store.test.ts):

```typescript
describe("StoreComponent", () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      key: initialValue
    });
  });

  it("should update state", () => {
    const { action } = useStore.getState();
    action(params);
    expect(useStore.getState().value).toBe(expected);
  });
});
```

Key patterns:
- Reset store state in `beforeEach`
- Access store with `getState()`
- Test actions and state updates
- Group related tests with `describe`

### 2. Persisted Store Testing

Example from [src/store/__tests__/ide-store.test.ts](mdc:src/store/__tests__/ide-store.test.ts):

```typescript
// Mock dependencies
vi.mock("../other-store", () => ({
  useOtherStore: {
    getState: () => ({
      method: vi.fn()
    })
  }
}));

// Test async operations
it("should handle async action", () => {
  const { action } = useStore.getState();
  action();
  vi.runAllTimers();
  expect(dependency.method).toHaveBeenCalled();
});
```

### 3. Interface Testing

Example from [src/interfaces/FileSystem/__tests__/FileSystem.test.ts](mdc:src/interfaces/FileSystem/__tests__/FileSystem.test.ts):

```typescript
// Mock factory
const createMockInterface = (): Interface => ({
  method: vi.fn()
});

describe("Interface", () => {
  let instance: Interface;

  beforeEach(() => {
    instance = createMockInterface();
  });

  it("should handle operations", async () => {
    instance.method = vi.fn().mockResolvedValue(result);
    await instance.method(params);
    expect(instance.method).toHaveBeenCalledWith(params);
  });
});
```

### 4. Component Testing

Use our custom test utilities:

```typescript
import { render, screen, fireEvent } from "@/test-utils";

describe("Component", () => {
  it("should render", () => {
    render(<Component />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Organization**
   - Co-locate tests with code
   - Use descriptive test names
   - Group related tests with `describe`
   - Keep tests focused and isolated

2. **Store Testing**
   - Reset store state before each test
   - Mock dependencies
   - Test state updates and actions
   - Handle async operations with `vi.runAllTimers()`

3. **Interface Testing**
   - Use mock factories
   - Test both success and error paths
   - Verify method calls and parameters
   - Test type guards

4. **Component Testing**
   - Test user interactions
   - Use role-based queries
   - Test loading and error states
   - Mock complex dependencies

5. **Mocking**
   - Mock at the lowest possible level
   - Use factory functions for complex mocks
   - Type your mocks properly
   - Reset mocks in `beforeEach`

## Common Patterns

### Testing Async Operations

```typescript
it("should handle async", async () => {
  const promise = instance.method();
  await expect(promise).resolves.toBe(expected);
});
```

### Testing Error Cases

```typescript
it("should handle errors", async () => {
  instance.method = vi.fn().mockRejectedValue(new Error("Failed"));
  await expect(instance.method()).rejects.toThrow("Failed");
});
```

### Testing Type Guards

```typescript
it("should validate types", () => {
  expect(isType(validInstance)).toBe(true);
  expect(isType(invalidInstance)).toBe(false);
});
```

## Debugging Tests

1. Use `test.only` or `describe.only` to run specific tests
2. Use `console.log()` for debugging (removed in production)
3. Use the UI mode with `pnpm test:ui` for better debugging
4. Check test coverage with `pnpm test:coverage`

## Coverage Goals

- Statements: > 80%
- Branches: > 80%
- Functions: > 80%
- Lines: > 80%

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zustand Testing](https://docs.pmnd.rs/zustand/guides/testing)

## API Route Testing

### Next.js API Routes

```typescript
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/app/api/filesystem/route';

describe('Filesystem API', () => {
  it('should handle GET request', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('files');
  });

  it('should handle errors', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { path: '/invalid/path' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
  });
});
```

### WebSocket Testing

Example from [src/components/terminal/useWebSocket.tsx](mdc:src/components/terminal/useWebSocket.tsx):

```typescript
import { renderHook, act } from '@testing-library/react';
import WS from 'jest-websocket-mock';
import { useWebSocket } from './useWebSocket';

describe('useWebSocket', () => {
  let server: WS;
  
  beforeEach(() => {
    server = new WS('ws://localhost:4000');
  });

  afterEach(() => {
    WS.clean();
  });

  it('should connect to websocket', async () => {
    const { result } = renderHook(() => useWebSocket());
    
    await server.connected;
    expect(result.current.connected).toBe(true);
  });

  it('should send and receive messages', async () => {
    const { result } = renderHook(() => useWebSocket());
    await server.connected;

    act(() => {
      result.current.sendCommand('test command');
    });

    await expect(server).toReceiveMessage(JSON.stringify({
      type: 'start',
      command: 'test command',
      internal: false,
    }));

    server.send(JSON.stringify({
      type: 'output',
      data: 'command output',
    }));

    expect(result.current.messages).toContainEqual(expect.objectContaining({
      type: 'system',
      content: 'command output',
    }));
  });

  it('should handle reconnection', async () => {
    const { result } = renderHook(() => useWebSocket());
    await server.connected;

    server.close();
    expect(result.current.connected).toBe(false);

    // Create new server to simulate reconnect
    server = new WS('ws://localhost:4000');
    await server.connected;
    
    expect(result.current.connected).toBe(true);
  });
});
```

### Web Worker Testing

Example for testing workers like [src/workers/file-system.worker.ts](mdc:src/workers/file-system.worker.ts):

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Worker
class WorkerMock {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

describe('FileSystem Worker', () => {
  let worker: Worker;
  let messages: any[] = [];

  beforeEach(() => {
    // Reset messages
    messages = [];
    
    // Create worker
    worker = new Worker(
      new URL('../workers/file-system.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Listen for messages
    worker.onmessage = (e) => {
      messages.push(e.data);
    };
  });

  afterEach(() => {
    worker.terminate();
  });

  it('should handle file operations', async () => {
    worker.postMessage({
      type: 'readFile',
      path: '/test.txt'
    });

    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(messages[0]).toEqual({
      type: 'fileContent',
      content: expect.any(String)
    });
  });

  it('should handle errors', async () => {
    worker.postMessage({
      type: 'readFile',
      path: '/nonexistent'
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(messages[0]).toEqual({
      type: 'error',
      error: expect.any(String)
    });
  });
});
```

For more complex workers, use a mock implementation:

```typescript
// Mock implementation
const createMockWorker = () => {
  const worker = new WorkerMock();
  
  worker.onmessage = (e) => {
    const { type, path } = e.data;
    
    switch (type) {
      case 'readFile':
        worker.postMessage({
          type: 'fileContent',
          content: 'mock content'
        });
        break;
      
      case 'writeFile':
        worker.postMessage({
          type: 'success'
        });
        break;
      
      default:
        worker.postMessage({
          type: 'error',
          error: 'Unknown command'
        });
    }
  };
  
  return worker;
};

describe('Worker with Mock', () => {
  it('should use mock worker', async () => {
    const worker = createMockWorker();
    
    const messages: any[] = [];
    worker.onmessage = (e) => messages.push(e.data);
    
    worker.postMessage({ type: 'readFile', path: '/test.txt' });
    
    expect(messages[0]).toEqual({
      type: 'fileContent',
      content: 'mock content'
    });
  });
});
```

## Testing Environment Setup

### API and WebSocket Testing
```bash
# Install required dependencies
pnpm add -D node-mocks-http jest-websocket-mock
```

Add to your Vitest config:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});
```

### Worker Testing
```typescript
// src/test/setup.ts
import { vi } from 'vitest';

// Mock Worker
class WorkerMock {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }
}

// Mock URL.createObjectURL
window.URL.createObjectURL = vi.fn();

// Mock Worker constructor
window.Worker = WorkerMock as any;
``` 