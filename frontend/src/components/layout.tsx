import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { role, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated && location !== "/login" && location !== "/register") {
    // This is handled by ProtectedRoute, but just in case
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href={role === "instructor" ? "/instructor" : role === "student" ? "/student" : "/"} className="flex items-center gap-2 mr-6 text-primary hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6" />
            <span className="font-bold text-lg hidden md:inline-block">Lumiere</span>
          </Link>

          <div className="flex-1" />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                <User className="h-4 w-4" />
                <span className="capitalize font-medium">{role}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
