import { Navigate, useLocation } from "react-router";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import RouteNames from "./RouteNames";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isLogin = useSelector((s: RootState) => s.auth.isLogin);
  const location = useLocation();
  if (!isLogin) {
    return (
      <Navigate
        to={RouteNames.LOGIN}
        state={{ from: location }}
        replace
      />
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute;
