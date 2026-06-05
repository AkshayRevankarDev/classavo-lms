import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstructorLayout } from "@/components/instructor-layout";
import { StudentLayout } from "@/components/student-layout";
import { ProtectedRoute } from "@/components/protected-route";

// Pages
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import InstructorDashboard from "@/pages/instructor/dashboard";
import InstructorCourseDetail from "@/pages/instructor/course-detail";
import InstructorChapterEditor from "@/pages/instructor/chapter-editor";
import StudentDashboard from "@/pages/student/dashboard";
import StudentMyCourses from "@/pages/student/my-courses";
import StudentCourseDetail from "@/pages/student/course-detail";
import StudentChapterReader from "@/pages/student/chapter-reader";
import { useAuth } from "@/hooks/use-auth";

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
          <InstructorLayout>
            <InstructorDashboard />
          </InstructorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/instructor/courses/:id">
        <ProtectedRoute allowedRole="instructor">
          <InstructorLayout>
            <InstructorCourseDetail />
          </InstructorLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/instructor/courses/:courseId/chapters/:chapterId">
        <ProtectedRoute allowedRole="instructor">
          <InstructorChapterEditor />
        </ProtectedRoute>
      </Route>

      <Route path="/student">
        <ProtectedRoute allowedRole="student">
          <StudentLayout>
            <StudentDashboard />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/my-courses">
        <ProtectedRoute allowedRole="student">
          <StudentLayout>
            <StudentMyCourses />
          </StudentLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/student/courses/:id">
        <ProtectedRoute allowedRole="student">
          <StudentCourseDetail />
        </ProtectedRoute>
      </Route>

      <Route path="/student/courses/:courseId/chapters/:chapterId">
        <ProtectedRoute allowedRole="student">
          <StudentChapterReader />
        </ProtectedRoute>
      </Route>

      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
