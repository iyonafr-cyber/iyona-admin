import { Navigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../store/store";
import { logout } from "../../store/authSlice";
import { LocalStorageService } from "../../services/local_storage/LocalStorageService";
import RouteNames from "./RouteNames";

interface RequireAdminProps {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();

  if (!user) return <Navigate to={RouteNames.LOGIN} replace />;
  if (user.role !== "admin") {
    LocalStorageService.clearTokens();
    dispatch(logout());
    return <Navigate to={RouteNames.LOGIN} replace />;
  }
  return <>{children}</>;
};

export default RequireAdmin;
