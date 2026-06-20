import { Navigate } from "react-router-dom";
import { useUserRole } from "@/context/UserRoleContext";
import type { UserRole } from "@/context/UserRoleContext";

interface Props {
  children: React.ReactNode;
  /** Roles allowed to access this route. If omitted, any authenticated role can access. */
  allowedRoles?: UserRole[];
  /** Where to redirect if access denied. Defaults to role's home portal. */
  redirectTo?: string;
}

/** Maps each role to its default home portal URL */
export const ROLE_HOME: Record<UserRole, string> = {
  superadmin:  "/dashboard",
  admin:       "/admin",
  manager:     "/manager",
  staff:       "/staff",
  provider:    "/provider",
  partner:     "/partner",
  agent:       "/agent",
  vendor:      "/vendor",
  marketing:   "/marketing",
  viewer:      "/",
  user:        "/portal",
};

/** All routes each role can access — matches the KemetRise permissions matrix */
export const ROLE_ACCESS: Record<UserRole, string[]> = {
  superadmin: ["*"],   // unrestricted — full access to everything
  admin: [
    "/dashboard", "/admin", "/manager", "/staff", "/partner", "/agent",
    "/vendor", "/provider", "/marketing", "/portal", "/erp/hr", "/erp/ledger",
    "/erp", "/brands", "/employees", "/operations", "/notifications",
    "/audit-logs", "/team", "/reports", "/settings", "/finance-analytics",
    "/api-docs", "/referrals", "/digital-inheritance", "/legendary-journey",
    "/automations", "/backups", "/changelog", "/help", "/workflow-map",
    "/permissions", "/user-management", "/chat", "/marketplace", "/digital-mall",
    "/admin/website", "/admin/website-services",
  ],
  manager: [
    "/dashboard", "/manager", "/staff", "/partner", "/agent", "/vendor",
    "/provider", "/marketing", "/portal", "/erp/hr", "/erp/ledger",
    "/operations", "/notifications", "/reports", "/settings",
    "/brands", "/team", "/finance-analytics", "/chat", "/help",
    "/marketplace", "/digital-mall",
  ],
  staff: [
    "/staff", "/portal", "/notifications", "/settings", "/chat", "/help",
  ],
  provider: [
    "/provider", "/portal", "/notifications", "/settings", "/chat", "/help",
  ],
  partner: [
    "/partner", "/portal", "/notifications", "/settings", "/chat", "/help",
  ],
  agent: [
    "/agent", "/portal", "/notifications", "/settings", "/chat", "/help",
  ],
  vendor: [
    "/vendor", "/portal", "/marketplace", "/digital-mall",
    "/notifications", "/settings", "/chat", "/help",
  ],
  marketing: [
    "/marketing", "/portal", "/notifications", "/settings",
    "/chat", "/help", "/reports",
  ],
  user: [
    "/portal", "/marketplace", "/digital-mall", "/erp/hr", "/erp/ledger",
    "/notifications", "/settings", "/chat", "/help", "/checkout",
  ],
  viewer: [
    "/", "/about", "/services", "/products", "/our-projects",
    "/partners", "/our-agents", "/news", "/pricing", "/contact",
    "/privacy", "/terms",
  ],
};

/**
 * Checks whether a given role has access to a given path.
 * Superadmin always returns true.
 */
export function roleCanAccess(role: UserRole, path: string): boolean {
  if (role === "superadmin") return true;
  const allowed = ROLE_ACCESS[role] ?? [];
  return allowed.some((a) => a === "*" || path === a || path.startsWith(a + "/"));
}

/**
 * Route guard that wraps a protected route with role-based access control.
 * Must be used INSIDE ProtectedRoute (i.e., user is already authenticated).
 */
export const RoleProtectedRoute = ({ children, allowedRoles, redirectTo }: Props) => {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary text-sm">
        Loading permissions…
      </div>
    );
  }

  // Superadmin bypasses all role checks
  if (role === "superadmin") return <>{children}</>;

  // If specific roles required, check membership
  if (allowedRoles && !allowedRoles.includes(role)) {
    const dest = redirectTo ?? ROLE_HOME[role] ?? "/portal";
    return <Navigate to={dest} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
