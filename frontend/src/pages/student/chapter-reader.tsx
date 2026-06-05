import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  PlateEditor,
  EMPTY_VALUE,
  normalizePlateValue,
  type PlateValue,
} from "@/components/plate-editor";

export default function ChapterReader() {
  const params = useParams();
  const { courseId, chapterId } = params;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [value, setValue] = useState<PlateValue>(EMPTY_VALUE);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChapterData = async () => {
    try {
      setIsLoading(true);
      const [courseRes, chapterRes, chaptersRes] = await Promise.all([
        api.get(`/courses/${courseId}/`),
        api.get(`/courses/${courseId}/chapters/${chapterId}/`),
        api.get(`/courses/${courseId}/chapters/`),
      ]);
      setCourse(courseRes.data);
      setChapter(chapterRes.data);
      setChapters(
        chaptersRes.data.filter((c: any) => c.visibility === "public")
      );
      setValue(normalizePlateValue(chapterRes.data.content));

      const alreadyComplete = Boolean(chapterRes.data.completed);
      setCompleted(alreadyComplete);

      // Auto-mark as visited the first time a student opens the chapter.
      // Fire-and-forget — we don't block the reader on this, and silently
      // swallow errors (the explicit "Mark complete" button is the fallback).
      if (!alreadyComplete) {
        api
          .post(
            `/courses/${courseId}/chapters/${chapterId}/complete/`,
            {}
          )
          .then(() => setCompleted(true))
          .catch(() => {});
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chapter content.",
      });
      setLocation(`/student/courses/${courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && chapterId) fetchChapterData();
  }, [courseId, chapterId]);

  async function toggleComplete() {
    try {
      setMarking(true);
      if (completed) {
        await api.delete(
          `/courses/${courseId}/chapters/${chapterId}/complete/`
        );
        setCompleted(false);
        toast({ title: "Marked as not done" });
      } else {
        await api.post(
          `/courses/${courseId}/chapters/${chapterId}/complete/`,
          {}
        );
        setCompleted(true);
        toast({ title: "Marked complete" });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update progress.",
      });
    } finally {
      setMarking(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasContent =
    Array.isArray(value) &&
    value.some((n: any) =>
      n?.children?.some(
        (c: any) => typeof c?.text === "string" && c.text.length > 0
      )
    );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-16 bg-white border-b border-border flex items-center px-4 md:px-6 sticky top-0 z-10 shrink-0">
        <Link
          href={`/student/courses/${courseId}`}
          className="text-muted-foreground hover:text-primary transition-colors flex items-center text-sm font-medium mr-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Course</span>
        </Link>
        <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
        <div className="flex items-center ml-2 truncate flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {course?.name}
          </span>
          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {chapter?.title}
          </span>
        </div>

        <Button
          size="sm"
          variant={completed ? "secondary" : "default"}
          disabled={marking}
          onClick={toggleComplete}
          className="ml-4 shrink-0"
        >
          {completed ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />
              Completed
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 mr-2" />
              Mark complete
            </>
          )}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r border-border hidden lg:flex flex-col overflow-y-auto">
          <div className="p-4 border-b bg-slate-50/50 sticky top-0">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
              Chapters
            </h3>
          </div>
          <nav className="p-3 space-y-1">
            {chapters.map((ch, index) => {
              const isActive = String(ch.id) === String(chapterId);
              return (
                <Link
                  key={ch.id}
                  href={`/student/courses/${courseId}/chapters/${ch.id}`}
                >
                  <div
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-slate-100 text-foreground"
                    }`}
                  >
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`text-sm font-medium leading-tight ${
                        isActive ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {ch.title}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto relative p-4 md:p-8 lg:p-12">
          <article className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 lg:p-16 min-h-full">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-8 pb-8 border-b border-slate-100 leading-tight">
              {chapter?.title}
            </h1>

            {hasContent ? (
              <div className="prose prose-slate prose-lg max-w-none prose-p:leading-relaxed prose-p:text-slate-700">
                <PlateEditor value={value} resetKey={chapterId} readOnly />
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground italic text-lg">
                  This chapter has no content yet.
                </p>
              </div>
            )}

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between">
              <div />
              <Link href={`/student/courses/${courseId}`}>
                <Button variant="outline" className="text-slate-600">
                  Return to Course
                </Button>
              </Link>
            </div>
          </article>
        </main>
      </div>
    </div>
  );
}
