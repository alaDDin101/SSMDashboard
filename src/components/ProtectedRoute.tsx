import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({
  children,
  permission,
}: {
  children: React.ReactNode;
  /** Single permission, or any of the listed (OR). */
  permission?: string | string[];
}) {
  const { authenticated, hasPermission } = useAuth();
  if (!authenticated) return <Navigate to="/login" replace />;
  const allowed =
    !permission ||
    (Array.isArray(permission) ? permission.some((p) => hasPermission(p)) : hasPermission(permission));
  if (!allowed) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">غير مصرح</h2>
          <p className="text-muted-foreground">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

