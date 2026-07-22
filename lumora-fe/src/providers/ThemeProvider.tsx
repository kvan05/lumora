"use client";

import * as React from "react";
import { useServerInsertedHTML } from "next/navigation";

export interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string | string[];
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  resolvedTheme: string;
  themes: string[];
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
  forcedTheme,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(storageKey) || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem(storageKey) || defaultTheme;
      if (val === "system" && enableSystem) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return val;
    }
    return defaultTheme === "system" ? "light" : defaultTheme;
  });

  useServerInsertedHTML(() => {
    const attributeString = Array.isArray(attribute) ? attribute[0] : attribute;
    const isClass = attributeString === "class";
    
    const scriptContent = `
      (function() {
        try {
          var storageKey = '${storageKey}';
          var defaultTheme = '${defaultTheme}';
          var theme = localStorage.getItem(storageKey) || defaultTheme;
          var activeTheme = theme;
          if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }
          var root = document.documentElement;
          var isClass = ${isClass};
          if (isClass) {
            root.classList.remove('light', 'dark');
            root.classList.add(activeTheme);
          } else {
            root.setAttribute('${attributeString}', activeTheme);
          }
        } catch (e) {}
      })();
    `;
    
    return (
      <script
        id="theme-injection-script"
        dangerouslySetInnerHTML={{ __html: scriptContent }}
      />
    );
  });

  const setTheme = React.useCallback((newTheme: string) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch (e) {}
  }, [storageKey]);

  React.useEffect(() => {
    const applyTheme = (t: string) => {
      let activeTheme = t;
      if (t === "system" && enableSystem) {
        activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }

      setResolvedTheme(activeTheme);

      const root = window.document.documentElement;
      const attributes = Array.isArray(attribute) ? attribute : [attribute];

      let styleElement: HTMLStyleElement | null = null;
      if (disableTransitionOnChange) {
        styleElement = document.createElement("style");
        styleElement.appendChild(
          document.createTextNode(
            "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
          )
        );
        document.head.appendChild(styleElement);
      }

      attributes.forEach((attr) => {
        const isClass = attr === "class";
        if (isClass) {
          root.classList.remove("light", "dark");
          root.classList.add(activeTheme);
        } else {
          root.setAttribute(attr, activeTheme);
        }
      });

      if (styleElement) {
        window.getComputedStyle(document.body);
        setTimeout(() => {
          if (styleElement && document.head.contains(styleElement)) {
            document.head.removeChild(styleElement);
          }
        }, 1);
      }
    };

    applyTheme(forcedTheme || theme);

    if ((forcedTheme || theme) === "system" && enableSystem) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = () => {
        applyTheme("system");
      };
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }
  }, [theme, forcedTheme, attribute, enableSystem, disableTransitionOnChange]);

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        const val = e.newValue || defaultTheme;
        setThemeState(val);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [storageKey, defaultTheme]);

  const value = React.useMemo(
    () => ({
      theme: forcedTheme || theme,
      setTheme,
      resolvedTheme: forcedTheme || resolvedTheme,
      themes: ["light", "dark", "system"],
    }),
    [theme, setTheme, resolvedTheme, forcedTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
