import type { ReactNode } from "react";
import { usePagePerms } from "@/hooks/usePagePerms";
import { Skeleton } from "@/components/ui/skeleton";
import Unauthorized from "@/pages/Unauthorized";

interface PermissionGateProps {
  path:     string;
  children: ReactNode;
}

/**
 * Wraps a page/section and renders <Unauthorized /> if the current user
 * does not have access to the given path.
 */
export function PermissionGate({ path, children }: PermissionGateProps) {
  const { canAccess, loading } = usePagePerms();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!canAccess(path)) return <Unauthorized />;

  return <>{children}</>;
}
