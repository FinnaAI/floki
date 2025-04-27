import { useFileStore } from '@/store/file-store';
import { useCallback } from 'react';

interface UseFileOperationsOptions {
  onError?: (error: Error) => void;
  currentPath?: string;
}

export const useFileOperations = ({ onError, currentPath = "" }: UseFileOperationsOptions = {}) => {
  const fileStore = useFileStore();
  
  const saveFile = useCallback(async (filePath: string, content: string) => {
    try {
      // Use the file store's saveFileContent method
      await fileStore.saveFileContent(filePath, content);
      return { success: true };
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  }, [fileStore, onError]);

  return {
    saveFile,
  };
}; 