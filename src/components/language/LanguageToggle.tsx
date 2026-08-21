import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { toggleLanguage } from "../../store/languageSlice";

const STORAGE_KEY = "jarvis-language";
const EXPLICIT_FLAG_KEY = "jarvis-language-explicit";

interface LanguageToggleProps {
  compact?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LanguageToggle = ({ compact: _compact = false }: LanguageToggleProps) => {
  const dispatch = useDispatch();
  const current = useSelector((state: RootState) => state.language.current);

  const handleClick = () => {
    const next = current === "en" ? "fr" : "en";
    dispatch(toggleLanguage());
    try {
      localStorage.setItem(STORAGE_KEY, next);
      localStorage.setItem(EXPLICIT_FLAG_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  return (
    <div className="flex items-center border border-border rounded-full overflow-hidden text-[10px] font-semibold">
      <button
        onClick={() => handleClick()}
        className={`px-2 py-1 transition-colors ${current === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => handleClick()}
        className={`px-2 py-1 transition-colors ${current === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        aria-label="Français"
      >
        FR
      </button>
    </div>
  );
};

export default LanguageToggle;
