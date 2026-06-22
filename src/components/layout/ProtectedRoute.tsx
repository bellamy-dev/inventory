import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/Spinner";
import { Permission } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gta-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/inventaire" replace />;
  }

  return <>{children}</>;
}
