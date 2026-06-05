import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import InstructorDashboard from "@/pages/instructor/dashboard";
import InstructorCourseDetail from "@/pages/instructor/course-detail";
import InstructorChapterEditor from "@/pages/instructor/chapter-editor";
import StudentDashboard from "@/pages/student/dashboard";
import StudentCourseDetail from "@/pages/student/course-detail";
import StudentChapterReader from "@/pages/student/chapter-reader";

const queryClient = new QueryClient();

function RootRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (role === "instructor") return <Redirect to="/instructor" />;
  return <Redirect to="/student" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/" component={RootRedirect} />

      <Route path="/instructor">
        <ProtectedRoute allowedRole="instructor">
          <Layout><InstructorDashboard /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/instructor/courses/:id">
        <ProtectedRoute allowedRole="instructor">
          <Layout><InstructorCourseDetail /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/instructor/courses/:courseId/chapters/:chapterId">
        <ProtectedRoute allowedRole="instructor">
          <Layout><InstructorChapterEditor /></Layout>
        </ProtectedRoute>
      </Route>

      <Route path="/student">
        <ProtectedRoute allowedRole="student">
          <Layout><StudentDashboard /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses/:id">
        <ProtectedRoute allowedRole="student">
          <Layout><StudentCourseDetail /></Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses/:courseId/chapters/:chapterId">
        <ProtectedRoute allowedRole="student">
          <Layout><StudentChapterReader /></Layout>
        </ProtectedRoute>
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
