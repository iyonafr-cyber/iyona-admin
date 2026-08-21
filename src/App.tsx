import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import "./i18n";
import ThemeInitializer from "./components/theme/ThemeInitializer";
import LanguageInitializer from "./components/language/LanguageInitializer";
import ErrorBoundary from "./components/error-boundary/ErrorBoundary";
import AppRoutes from "./utils/routing/AppRoutes";
import { AuthService } from "./services/features/auth/AuthService";
import { LocalStorageService } from "./services/local_storage/LocalStorageService";
import { setUser, logout } from "./store/authSlice";
import useSyncI18nWithRedux from "./hooks/useSyncI18nWithRedux";

const App = () => {
  const dispatch = useDispatch();
  const [booted, setBooted] = useState(false);
  useSyncI18nWithRedux();

  useEffect(() => {
    const token = LocalStorageService.getAccessToken();
    if (!token) {
      queueMicrotask(() => setBooted(true));
      return;
    }
    void AuthService.getProfile()
      .then((user) => {
        if (user.role !== "admin") {
          LocalStorageService.clearTokens();
          dispatch(logout());
        } else {
          dispatch(setUser(user));
        }
      })
      .catch(() => {
        LocalStorageService.clearTokens();
        dispatch(logout());
      })
      .finally(() => setBooted(true));
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <ThemeInitializer />
      <LanguageInitializer />
      {booted ? (
        <AppRoutes />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
          Loading…
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3500} />
    </ErrorBoundary>
  );
};

export default App;
