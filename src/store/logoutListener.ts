import { createListenerMiddleware } from "@reduxjs/toolkit";
import { logout } from "./authSlice";

const THEME_STORAGE_KEY = "jarvis-theme";
const LANGUAGE_STORAGE_KEY = "jarvis-language";

/**
 * Clears persisted UI preferences when auth ends so they do not rehydrate
 * stale values on the next visit (language init reads localStorage on mount).
 */
export const logoutListenerMiddleware = createListenerMiddleware();
logoutListenerMiddleware.startListening({
  actionCreator: logout,
  effect: () => {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  },
});
