import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [role, setRole] = useState<string | null>(localStorage.getItem("user_role"));
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("access_token"));
      setRole(localStorage.getItem("user_role"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (newToken: string, newRole: string) => {
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("user_role", newRole);
    setToken(newToken);
    setRole(newRole);
    // Dispatch storage event so other tabs/components update
    window.dispatchEvent(new Event("storage"));
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    setToken(null);
    setRole(null);
    window.dispatchEvent(new Event("storage"));
    setLocation("/login");
  };

  return { token, role, login, logout, isAuthenticated: !!token };
}
