import { Compass, BookMarked } from "lucide-react";
import { SidebarLayout } from "./sidebar-layout";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/student", label: "Browse Courses", icon: <Compass className="h-4 w-4" /> },
    { href: "/student/my-courses", label: "My Courses", icon: <BookMarked className="h-4 w-4" /> },
  ];

  return <SidebarLayout links={links}>{children}</SidebarLayout>;
}
