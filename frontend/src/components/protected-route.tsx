import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode, allowedRole?: "instructor" | "student" }) {
  const { isAuthenticated, role } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (allowedRole && role !== allowedRole) {
      // Redirect to their respective dashboard if they try to access the wrong role's page
      setLocation(role === "instructor" ? "/instructor" : "/student");
    }
  }, [isAuthenticated, role, allowedRole, setLocation]);

  if (!isAuthenticated || (allowedRole && role !== allowedRole)) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
