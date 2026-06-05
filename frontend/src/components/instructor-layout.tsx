import { BookOpen } from "lucide-react";
import { SidebarLayout } from "./sidebar-layout";

export function InstructorLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { href: "/instructor", label: "My Courses", icon: <BookOpen className="h-4 w-4" /> },
  ];

  return <SidebarLayout links={links}>{children}</SidebarLayout>;
}
