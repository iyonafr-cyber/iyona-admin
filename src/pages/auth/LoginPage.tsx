import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import Button from "../../components/button/Button";
import ThemeToggle from "../../components/theme/ThemeToggle";
import LanguageToggle from "../../components/language/LanguageToggle";
import { AuthService } from "../../services/features/auth/AuthService";
import { LocalStorageService } from "../../services/local_storage/LocalStorageService";
import { getApiErrorMessage } from "../../api/getApiErrorMessage";
import { ToastService } from "../../services/toast";
import { setAuth, logout } from "../../store/authSlice";
import RouteNames from "../../utils/routing/RouteNames";

const LoginPage = () => {
  const { t } = useTranslation("admin");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  const from = location.state?.from?.pathname ?? RouteNames.DASHBOARD;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !email || !password) return;
    setSubmitting(true);
    try {
      const data = await AuthService.loginUser({ email, password });
      if (data.role !== "admin") {
        LocalStorageService.clearTokens();
        dispatch(logout());
        ToastService.error(t("login.forbidden"));
        return;
      }
      dispatch(
        setAuth({
          user: {
            _id: data._id,
            email: data.email,
            role: data.role,
            isVerified: data.isVerified,
            isDeleted: data.isDeleted,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastLoginAt: data.lastLoginAt ?? null,
          },
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          },
        }),
      );
      navigate(from, { replace: true });
    } catch (err) {
      ToastService.error(getApiErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img
            src="/iyona-logo.png"
            alt="Iyona"
            className="h-7 w-7 rounded object-contain"
          />
          <span className="text-sm font-semibold">Iyona Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center mb-6">
            <img
              src="/iyona-logo.png"
              alt="Iyona"
              className="h-14 w-14 rounded-full bg-primary/30 object-contain p-1"
            />
            <h1 className="text-lg font-semibold">{t("login.title")}</h1>
            <p className="text-xs text-muted-foreground">
              {t("login.subtitle")}
            </p>
          </div>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                {t("login.email")}
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                {t("login.password")}
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/60"
              />
            </label>
            <Button type="submit" disabled={submitting} className="w-full mt-2">
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {t("login.submitting")}
                </span>
              ) : (
                t("login.submit")
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
