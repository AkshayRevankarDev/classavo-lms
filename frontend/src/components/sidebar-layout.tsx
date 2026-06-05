import { Link, useLocation } from "wouter";
import { BookOpen, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function SidebarLayout({
  children,
  links,
}: {
  children: React.ReactNode;
  links: Array<{ href: string; label: string; icon: React.ReactNode }>;
}) {
  const { role, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background h-16 flex items-center px-4 md:px-6">
        <Link href={role === "instructor" ? "/instructor" : role === "student" ? "/student" : "/"} className="flex items-center gap-2 mr-6 text-primary hover:opacity-80 transition-opacity">
          <div className="bg-primary/10 p-2 rounded-full">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg hidden md:inline-block text-foreground">Lumiere</span>
        </Link>
        <div className="flex-1" />
        {isAuthenticated && (
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
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {links.map((link) => {
              const isActive = location === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    {link.icon}
                    <span className="font-medium text-sm">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
