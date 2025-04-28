"use client";

import { useFileStore } from "@/store/file-store";
import { useEffect, useState } from "react";

/**
 * Component that initializes the file store on mount
 * This handles loading directory handles from IndexedDB and restoring permissions
 */
export function FileStoreInitializer() {
  const { loadDirectoryHandlesFromIndexedDB, requestPersistentStorage } = useFileStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // First try to get persistent storage permission
        await requestPersistentStorage();
        
        // Then load any saved directory handles
        await loadDirectoryHandlesFromIndexedDB();
        
        setInitialized(true);
        console.log("File store initialized successfully");
      } catch (error) {
        console.error("Error initializing file store:", error);
      }
    }

    initialize();
  }, [loadDirectoryHandlesFromIndexedDB, requestPersistentStorage]);

  // This component doesn't render anything visible
  return null;
} 