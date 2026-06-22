import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRole, UserRole } from "@/context/UserRoleContext";
import { Skeleton } from "@/components/ui/skeleton";

type AllowedRoles = UserRole | UserRole[];

interface Props {
  allow: AllowedRoles;
  redirectTo?: string;
  children: ReactNode;
}

/**
 * RoleGuard — renders children only if the current user's role is in `allow`.
 * On role mismatch, redirects to the appropriate portal for their actual role.
 */
export default function RoleGuard({ allow, redirectTo, children }: Props) {
  const { role, loading } = useRole();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  const allowed = Array.isArray(allow) ? allow : [allow];

  // Superadmin can access everything; admin bypasses role checks when admin is explicitly allowed
  if (role === "superadmin" || (role === "admin" && allowed.includes("admin"))) {
    return <>{children}</>;
  }

  if (allowed.includes(role as UserRole)) {
    return <>{children}</>;
  }

  // Redirect to their correct portal
  const dest = redirectTo ?? roleHome(role as UserRole);
  return <Navigate to={dest} state={{ from: location }} replace />;
}

export function roleHome(role: UserRole | string): string {
  switch (role) {
    case "superadmin":
    case "admin":    return "/admin";
    case "partner":  return "/partner";
    case "agent":    return "/agent";
    case "vendor":
    case "provider": return "/vendor";
    case "marketing":return "/marketing";
    default:         return "/portal";
  }
}
