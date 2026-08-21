import { useDispatch, useSelector } from "react-redux";
import { Moon, Sun } from "lucide-react";
import type { RootState } from "../../store/store";
import { toggleTheme } from "../../store/themeSlice";

interface ThemeToggleProps {
  compact?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ThemeToggle = ({ compact: _compact = false }: ThemeToggleProps) => {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.theme.mode);

  const isDark = mode === "dark";

  return (
    // <button
    //   type="button"
    //   onClick={() => dispatch(toggleTheme())}
    //   className={`inline-flex items-center justify-center rounded-full border text-xs font-medium transition-colors cursor-pointer ${
    //     compact
    //       ? "h-8 w-8 border-gray-300 bg-white/80 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:bg-gray-700"
    //       : "px-3 py-1.5 gap-2 border-gray-300 bg-white/80 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800/80 dark:hover:bg-gray-700"
    //   }`}
    //   aria-label="Toggle dark mode"
    // >
    //   {isDark ? (
    //     <>
    //       <Moon className="h-4 w-4 text-indigo-300" />
    //       {!compact && <span className="text-xs text-gray-800 dark:text-gray-100">Dark</span>}
    //     </>
    //   ) : (
    //     <>
    //       <Sun className="h-4 w-4 text-amber-400" />
    //       {!compact && <span className="text-xs text-gray-800 dark:text-gray-100">Light</span>}
    //     </>
    //   )}
    // </button>
    <button
      onClick={() => dispatch(toggleTheme())}
      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {!isDark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default ThemeToggle;
