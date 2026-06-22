import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/context/UserRoleContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: roleLoading } = useUserRole();
  if (authLoading || roleLoading) return <div className="min-h-screen flex items-center justify-center text-primary">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.is_suspended) return <Navigate to="/auth?suspended=1" replace />;
  return <>{children}</>;
};
