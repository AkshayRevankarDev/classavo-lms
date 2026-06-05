import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Book, Users, ChevronRight, Loader2, Compass } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get("/courses/"),
        api.get("/my-enrollments/")
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load courses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoin = async (courseId: string) => {
    try {
      setJoiningId(courseId);
      await api.post(`/courses/${courseId}/enroll/`, {});
      toast({ title: "Success", description: "You have enrolled in the course!" });
      // Refresh enrollments
      const enrollmentsRes = await api.get("/my-enrollments/");
      setEnrollments(enrollmentsRes.data);
      setLocation(`/student/courses/${courseId}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to enroll in the course.",
      });
    } finally {
      setJoiningId(null);
    }
  };

  const enrollmentFor = (courseId: any) =>
    enrollments.find(
      (e) => e.course === courseId || e.course?.id === courseId
    );
  const isEnrolled = (courseId: any) => Boolean(enrollmentFor(courseId));

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Discover Courses</h1>
        <p className="text-muted-foreground">Find and enroll in courses to expand your knowledge.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardFooter className="bg-muted/50 p-4 border-t">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-4 flex-1">
                  <div className="bg-primary/5 p-3 rounded-xl mb-4 inline-flex self-start">
                    <Compass className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl line-clamp-2">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-3 mt-2 mb-4">
                    {course.description}
                  </CardDescription>
                  <div className="mt-auto flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Instructor: {course.instructor?.username || "Unknown"}</span>
                  </div>
                </CardHeader>
                <CardFooter className="bg-muted/10 p-4 border-t flex-col gap-3 items-stretch">
                  {enrolled ? (
                    <>
                      {(() => {
                        const e = enrollmentFor(course.id);
                        const p = e?.progress;
                        if (!p || p.total === 0) {
                          return (
                            <div className="text-xs text-muted-foreground">
                              No public chapters yet
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {p.completed} of {p.total} chapters
                              </span>
                              <span>{p.percent}%</span>
                            </div>
                            <Progress value={p.percent} className="h-2" />
                          </div>
                        );
                      })()}
                      <Link href={`/student/courses/${course.id}`} className="w-full">
                        <Button variant="secondary" className="w-full group">
                          Continue Learning
                          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleJoin(course.id)}
                      disabled={joiningId === course.id}
                    >
                      {joiningId === course.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Join Course
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No courses available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Check back later. Instructors are currently working on new materials.
          </p>
        </div>
      )}
    </div>
  );
}
