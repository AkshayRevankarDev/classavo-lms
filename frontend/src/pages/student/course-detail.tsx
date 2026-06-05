import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  LogOut,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function StudentCourseDetail() {
  const params = useParams();
  const courseId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [progress, setProgress] = useState<{
    completed_chapter_ids: number[];
    completed: number;
    total: number;
    percent: number;
  }>({ completed_chapter_ids: [], completed: 0, total: 0, percent: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const [courseRes, chaptersRes, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}/`),
        api.get(`/courses/${courseId}/chapters/`),
        api.get(`/courses/${courseId}/progress/`),
      ]);
      setCourse(courseRes.data);
      setChapters(chaptersRes.data.filter((c: any) => c.visibility === "public"));
      setProgress(progressRes.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You cannot view this course.",
      });
      setLocation("/student");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  async function onLeave() {
    try {
      setLeaving(true);
      await api.post(`/courses/${courseId}/leave/`);
      toast({ title: "Left course", description: "You have unenrolled." });
      setLocation("/student");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to leave course.",
      });
    } finally {
      setLeaving(false);
      setConfirmLeave(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/3 mb-8" />
        <Skeleton className="h-32 w-full mb-12" />
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const isComplete = (id: number) =>
    progress.completed_chapter_ids.includes(id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/student"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold tracking-tight">{course?.name}</h1>

          <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive shrink-0"
              onClick={() => setConfirmLeave(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Course
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this course?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose your progress and won't see this course in "My
                  Courses" anymore. You can re-join from the browse page anytime.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onLeave}
                  disabled={leaving}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {leaving ? "Leaving…" : "Leave course"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>
              Instructor:{" "}
              <span className="font-medium text-foreground">
                {course?.instructor?.username}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>{chapters.length} Chapters</span>
          </div>
        </div>

        {progress.total > 0 && (
          <div className="rounded-xl border bg-card p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your progress</span>
              <span className="text-sm text-muted-foreground">
                {progress.completed} of {progress.total} chapters ·{" "}
                {progress.percent}%
              </span>
            </div>
            <Progress value={progress.percent} className="h-2" />
          </div>
        )}

        <div className="prose prose-neutral max-w-none">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {course?.description}
          </p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Course Content</h2>

        {chapters.length > 0 ? (
          <div className="grid gap-4">
            {chapters.map((chapter, index) => {
              const done = isComplete(chapter.id);
              return (
                <Link
                  key={chapter.id}
                  href={`/student/courses/${courseId}/chapters/${chapter.id}`}
                >
                  <div className="group border rounded-xl p-6 bg-card hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex items-center gap-6">
                    <div
                      className={
                        "h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors " +
                        (done
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground")
                      }
                    >
                      {done ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                        {chapter.title}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {done ? (
                          <span className="inline-flex items-center text-emerald-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <Circle className="h-4 w-4 mr-1" /> Not started
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium">No chapters available yet</h3>
            <p className="text-muted-foreground">
              The instructor hasn't published any content for this course.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
