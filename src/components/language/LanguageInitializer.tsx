import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setLanguage, type LanguageCode } from "../../store/languageSlice";
import {
  detectLanguageFromBrowser,
  detectLanguageFromIP,
} from "../../utils/detectLanguage";
import { readMigratedLocalStorage } from "../../utils/storage/preferenceMigration";

// Bucket B (rebrand): keys renamed jarvis-* → iyona-*, migrated on read.
const STORAGE_KEY = "iyona-language";
const EXPLICIT_FLAG_KEY = "iyona-language-explicit";
const LEGACY_STORAGE_KEY = "jarvis-language";
const LEGACY_EXPLICIT_FLAG_KEY = "jarvis-language-explicit";

const readStoredLanguage = (): LanguageCode | null => {
  const stored = readMigratedLocalStorage(STORAGE_KEY, LEGACY_STORAGE_KEY);
  if (stored === "en" || stored === "fr") return stored;
  return null;
};

const userHasExplicitlyChosen = (): boolean => {
  return (
    readMigratedLocalStorage(EXPLICIT_FLAG_KEY, LEGACY_EXPLICIT_FLAG_KEY) === "1"
  );
};

const persistDetectedLanguage = (lang: LanguageCode) => {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore storage errors
  }
};

const LanguageInitializer = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const stored = readStoredLanguage();

    if (stored) {
      dispatch(setLanguage(stored));
      // If the user explicitly chose, we're done — respect their choice.
      if (userHasExplicitlyChosen()) return;
    } else {
      // No stored preference: apply the fastest available guess so the UI
      // doesn't flash English before geo-detection finishes.
      const browserGuess = detectLanguageFromBrowser();
      dispatch(setLanguage(browserGuess));
      persistDetectedLanguage(browserGuess);
    }

    let cancelled = false;
    void (async () => {
      const fromIp = await detectLanguageFromIP();
      if (cancelled || !fromIp) return;
      // Don't override an explicit user choice that may have been made
      // between first paint and this async result.
      if (userHasExplicitlyChosen()) return;
      dispatch(setLanguage(fromIp));
      persistDetectedLanguage(fromIp);
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
};

export default LanguageInitializer;
