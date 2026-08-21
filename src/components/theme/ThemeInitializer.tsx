import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { setTheme, type ThemeMode } from "../../store/themeSlice";

const STORAGE_KEY = "jarvis-theme";

const ThemeInitializer = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.theme.mode);

  useEffect(() => {
    // Only run once on mount to initialize from localStorage
    let initialMode: ThemeMode = "light";

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "light" || stored === "dark") {
        initialMode = stored;
      } else {
        // If no stored preference, check current HTML class (set by inline script)
        const root = document.documentElement;
        if (root.classList.contains("dark")) {
          initialMode = "dark";
        }
      }
      // Don't use system preference - always default to light unless user explicitly set dark
    } catch {
      // Ignore storage errors and fall back to light
    }

    console.log("ThemeInitializer: Setting initial mode to", initialMode);
    dispatch(setTheme(initialMode));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    const root = document.documentElement;

    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  }, [mode]);

  return null;
};

export default ThemeInitializer;

