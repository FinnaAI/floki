import { useIDEStore } from "@/store/ide-store";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createHighlighter } from "shiki";

interface ThemeContextType {
  isThemeReady: boolean;
  currentTheme: string;
  initializeTheme: (themeName: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Convert theme name to Shiki format (lowercase, no spaces, hyphens)
const formatThemeNameForShiki = (themeName: string) => {
  return themeName.toLowerCase().replace(/\s+/g, "-");
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [highlighter, setHighlighter] = useState<Awaited<ReturnType<typeof createHighlighter>> | null>(null);
  
  // Get theme from IDE store
  const { editorTheme: currentTheme, setEditorTheme } = useIDEStore();

  const initializeTheme = useCallback(async (themeName: string) => {
    try {
      const shikiThemeName = formatThemeNameForShiki(themeName);
      console.log('Theme Context - Initializing theme:', shikiThemeName);

      // Create new highlighter with the theme
      const newHighlighter = await createHighlighter({
        themes: ["github-dark", shikiThemeName],
        langs: ["jsx", "tsx", "vue", "svelte", "typescript", "javascript"],
      });

      setHighlighter(newHighlighter);
      setEditorTheme(themeName); // Update the store
      setIsThemeReady(true);
      console.log('Theme Context - Theme initialized:', shikiThemeName);
    } catch (error) {
      console.error('Theme Context - Error initializing theme:', error);
      // Fallback to github-dark
      try {
        const newHighlighter = await createHighlighter({
          themes: ["github-dark"],
          langs: ["jsx", "tsx", "vue", "svelte", "typescript", "javascript"],
        });
        setHighlighter(newHighlighter);
        setEditorTheme("github-dark"); // Update the store with fallback
        setIsThemeReady(true);
        console.log('Theme Context - Fallback theme initialized');
      } catch (fallbackError) {
        console.error('Theme Context - Critical error:', fallbackError);
      }
    }
  }, [setEditorTheme]);

  // Initialize with theme from store on mount
  useEffect(() => {
    console.log('Theme Context - Initial theme from store:', currentTheme);
    void initializeTheme(currentTheme);
  }, [currentTheme, initializeTheme]);

  const contextValue = {
    isThemeReady,
    currentTheme,
    initializeTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
} 