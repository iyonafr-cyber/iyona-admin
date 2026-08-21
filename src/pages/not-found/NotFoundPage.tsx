import { Link } from "react-router";
import RouteNames from "../../utils/routing/RouteNames";

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
    <div className="text-center space-y-3 max-w-md">
      <div className="text-6xl font-bold">404</div>
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to={RouteNames.DASHBOARD}
        className="inline-block rounded-md bg-primary text-primary-foreground text-sm px-3 py-2 hover:bg-primary/90"
      >
        Back to dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
