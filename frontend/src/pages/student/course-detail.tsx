import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  LogOut,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
      setChapters(
        chaptersRes.data.filter((c: any) => c.visibility === "public")
      );
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
      setLocation("/student/my-courses");
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
      <div className="flex h-screen bg-slate-50">
        <div className="w-80 bg-white border-r hidden md:flex flex-col">
          <div className="p-6 border-b">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
        <div className="flex-1 p-8 lg:p-12">
          <Skeleton className="h-8 w-24 mb-8" />
          <Skeleton className="h-12 w-2/3 mb-6" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="h-32 w-full max-w-3xl" />
        </div>
      </div>
    );
  }

  const isComplete = (id: number) =>
    progress.completed_chapter_ids.includes(id);

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row">
      <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-border shrink-0 sticky top-0 h-auto md:h-screen overflow-y-auto">
        <div className="p-6 border-b border-border bg-slate-50/50 sticky top-0 backdrop-blur-sm">
          <h2 className="font-bold text-foreground text-lg flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary" />
            Course Chapters
          </h2>
        </div>
        <nav className="p-4 space-y-2">
          {chapters.length > 0 ? (
            chapters.map((chapter, index) => {
              const done = isComplete(chapter.id);
              return (
                <Link
                  key={chapter.id}
                  href={`/student/courses/${courseId}/chapters/${chapter.id}`}
                >
                  <div className="group flex items-start gap-3 p-3 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors border border-transparent hover:border-primary/10">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 transition-colors ${
                        done
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-slate-100 text-slate-500 group-hover:bg-primary group-hover:text-primary-foreground"
                      }`}
                    >
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary leading-tight mb-1 transition-colors">
                        {chapter.title}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center">
                        {done ? (
                          <span className="text-emerald-600 inline-flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <Circle className="h-3 w-3 mr-1" /> Not started
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center p-6 text-muted-foreground text-sm">
              No chapters available.
            </div>
          )}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <Link
              href="/student"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>

            <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmLeave(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Course
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave this course?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose your progress and won't see this course in
                    "My Courses" anymore. You can re-join from the browse page
                    anytime.
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

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            {course?.name}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 mb-8 bg-white p-4 rounded-xl border border-slate-200 inline-flex shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">
                Instructor: {course?.instructor?.username}
              </span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {chapters.length} Chapters
              </span>
            </div>
          </div>

          {progress.total > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-5 mb-10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Your progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress.completed} of {progress.total} chapters ·{" "}
                  {progress.percent}%
                </span>
              </div>
              <Progress value={progress.percent} className="h-2" />
            </div>
          )}

          <div className="prose prose-slate lg:prose-lg">
            <h3 className="text-xl font-bold mb-4 text-foreground">
              About this course
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {course?.description}
            </p>
          </div>

          {chapters.length > 0 && (() => {
            const firstIncompleteIndex = chapters.findIndex(
              (c) => !progress.completed_chapter_ids.includes(c.id)
            );
            const allDone = firstIncompleteIndex === -1;
            const targetIndex = allDone ? 0 : firstIncompleteIndex;
            const target = chapters[targetIndex];
            const noneStarted = progress.completed === 0;
            const label = allDone
              ? "Review from Chapter 1"
              : noneStarted
              ? `Start Reading Chapter ${targetIndex + 1}`
              : `Continue with Chapter ${targetIndex + 1}`;
            return (
              <div className="mt-12">
                <Link
                  href={`/student/courses/${courseId}/chapters/${target.id}`}
                >
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white font-medium px-8 h-12 text-base rounded-full shadow-md"
                  >
                    {label}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
