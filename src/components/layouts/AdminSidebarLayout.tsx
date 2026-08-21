import { NavLink, Outlet, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Coins,
  Cpu,
  Route as RouteIcon,
  KeyRound,
  ScrollText,
  Settings,
  LogOut,
} from "lucide-react";
import type { RootState } from "../../store/store";
import { logout } from "../../store/authSlice";
import { AuthService } from "../../services/features/auth/AuthService";
import RouteNames from "../../utils/routing/RouteNames";
import ThemeToggle from "../theme/ThemeToggle";
import LanguageToggle from "../language/LanguageToggle";
import Badge from "../ui/Badge";

const AdminSidebarLayout = () => {
  const { t } = useTranslation("admin");
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch {
      /* ignore – we still clear client-side */
    }
    dispatch(logout());
    navigate(RouteNames.LOGIN, { replace: true });
  };

  const navItems: Array<{
    to: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
  }> = [
    { to: RouteNames.DASHBOARD, label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: RouteNames.USERS, label: t("nav.users"), icon: Users },
    { to: RouteNames.PROJECTS, label: t("nav.projects"), icon: FolderKanban },
    { to: RouteNames.CREDITS, label: t("nav.credits"), icon: Coins },
    { to: RouteNames.MODELS, label: t("nav.models"), icon: Cpu },
    { to: RouteNames.TASK_ROUTES, label: t("nav.taskRoutes"), icon: RouteIcon },
    { to: RouteNames.PROVIDER_KEYS, label: t("nav.providerKeys"), icon: KeyRound },
    { to: RouteNames.AUDIT, label: t("nav.audit"), icon: ScrollText },
    { to: RouteNames.SETTINGS, label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur">
        <div className="flex shrink-0 items-center gap-2 px-5 py-5 border-b border-border">
          <img
            src="/iyona-logo.png"
            alt="Iyona"
            className="h-9 w-9 rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              Iyona Admin
            </span>
            <span className="text-[10px] text-muted-foreground">
              Operator console
            </span>
          </div>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === RouteNames.DASHBOARD}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/20 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="shrink-0 border-t border-border px-4 py-3 space-y-2">
          {user && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground">
                {user.email.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">
                  {user.email}
                </div>
                <Badge tone="primary" className="mt-0.5">
                  {user.role}
                </Badge>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <LanguageToggle />
            <button
              onClick={() => void handleLogout()}
              title={t("nav.logout")}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex h-screen flex-1 min-w-0 flex-col">
        <header className="md:hidden flex shrink-0 items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card/60 backdrop-blur">
          <div className="flex items-center gap-2">
            <img
              src="/iyona-logo.png"
              alt="Iyona"
              className="h-6 w-6 rounded object-contain"
            />
            <span className="text-sm font-semibold">Iyona Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <button
              onClick={() => void handleLogout()}
              title={t("nav.logout")}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-red-500"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-5 py-6 md:px-8 md:py-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSidebarLayout;
