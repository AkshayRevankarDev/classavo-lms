import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Users, ChevronRight, Compass, BookMarked } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

const GRADIENTS = [
  "from-blue-400 to-indigo-600",
  "from-emerald-400 to-teal-600",
  "from-violet-400 to-purple-600",
  "from-orange-400 to-red-500",
  "from-pink-400 to-rose-600",
];

export default function StudentMyCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, enrollmentsRes] = await Promise.all([
        api.get("/courses/"),
        api.get("/my-enrollments/"),
      ]);
      setCourses(coursesRes.data);
      setEnrollments(enrollmentsRes.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your courses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrollmentFor = (courseId: any) =>
    enrollments.find(
      (e) => e.course === courseId || e.course?.id === courseId
    );
  const enrolledCourseIds = new Set(
    enrollments.map((e) => e.course?.id ?? e.course)
  );
  const myCourses = courses.filter((c) => enrolledCourseIds.has(c.id));

  return (
    <div className="container mx-auto py-8 px-4 lg:px-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">My Courses</h1>
        <p className="text-muted-foreground">
          Continue learning from where you left off.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
      ) : myCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCourses.map((course, index) => {
            const enr = enrollmentFor(course.id);
            const p = enr?.progress;
            const bg = GRADIENTS[index % GRADIENTS.length];
            return (
              <Card
                key={course.id}
                className="flex flex-col overflow-hidden bg-white shadow-sm border hover:shadow-md transition-all duration-200 rounded-xl"
              >
                <div className={`h-36 w-full bg-gradient-to-r ${bg}`} />
                <CardHeader className="pb-4 flex-1">
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {course.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 text-sm text-muted-foreground">
                    {course.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{course.instructor?.username || "Unknown"}</span>
                  </div>
                </CardHeader>
                <CardFooter className="bg-white p-4 border-t flex-col gap-3 items-stretch">
                  {p && p.total > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {p.completed} of {p.total} chapters
                        </span>
                        <span>{p.percent}%</span>
                      </div>
                      <Progress value={p.percent} className="h-2" />
                    </div>
                  )}
                  <Link
                    href={`/student/courses/${course.id}`}
                    className="w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full group border-primary text-primary hover:bg-primary/5"
                    >
                      Continue Learning
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border shadow-sm">
          <div className="bg-primary/5 p-4 rounded-full inline-block mb-4">
            <BookMarked className="h-12 w-12 text-primary opacity-80" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            You haven't joined any courses
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Browse the available courses and enroll to start learning.
          </p>
          <Link href="/student">
            <Button>
              <Compass className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
