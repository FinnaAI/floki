"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

interface IdeLayoutState {
  showFileTree: boolean;
  showFileContent: boolean;
  showTerminal: boolean;
  showCodex: boolean;
  toggleFileTree: () => void;
  toggleFileContent: () => void;
  toggleTerminal: () => void;
  toggleCodex: () => void;
}

const IdeLayoutContext = createContext<IdeLayoutState | undefined>(undefined);

interface IdeLayoutProviderProps {
  children: ReactNode;
}

export function IdeLayoutProvider({ children }: IdeLayoutProviderProps) {
  const [showFileTree, setShowFileTree] = useState(true);
  const [showFileContent, setShowFileContent] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showCodex, setShowCodex] = useState(true);
  const toggleFileTree = useCallback(() => setShowFileTree((p) => !p), []);
  const toggleFileContent = useCallback(
    () => setShowFileContent((p) => !p),
    []
  );
  const toggleTerminal = useCallback(() => setShowTerminal((p) => !p), []);
  const toggleCodex = useCallback(() => setShowCodex((p) => !p), []);
  const value: IdeLayoutState = {
    showFileTree,
    showFileContent,
    showTerminal,
    showCodex,
    toggleFileTree,
    toggleFileContent,
    toggleTerminal,
    toggleCodex,
  };

  return (
    <IdeLayoutContext.Provider value={value}>
      {children}
    </IdeLayoutContext.Provider>
  );
}

export function useIdeLayout() {
  const ctx = useContext(IdeLayoutContext);
  if (!ctx) {
    throw new Error("use_ide_layout must be used within ide_layout_provider");
  }
  return ctx;
}
