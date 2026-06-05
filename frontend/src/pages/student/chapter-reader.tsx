import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from "lucide-react";
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
  const [value, setValue] = useState<PlateValue>(EMPTY_VALUE);
  const [completed, setCompleted] = useState(false);
  const [marking, setMarking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChapterData = async () => {
    try {
      const [courseRes, chapterRes] = await Promise.all([
        api.get(`/courses/${courseId}/`),
        api.get(`/courses/${courseId}/chapters/${chapterId}/`),
      ]);
      setCourse(courseRes.data);
      setChapter(chapterRes.data);
      setValue(normalizePlateValue(chapterRes.data.content));
      setCompleted(Boolean(chapterRes.data.completed));
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
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasContent =
    Array.isArray(value) &&
    value.some((n: any) =>
      n?.children?.some((c: any) => typeof c?.text === "string" && c.text.length > 0)
    );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-muted/10 pb-20">
      <div className="bg-background border-b sticky top-14 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-3xl flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0">
            <Link
              href={`/student/courses/${courseId}`}
              className="mr-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5 truncate">
                {course?.name}
              </div>
              <h1 className="text-lg font-semibold leading-tight truncate">
                {chapter?.title}
              </h1>
            </div>
          </div>

          <Button
            variant={completed ? "secondary" : "default"}
            size="sm"
            disabled={marking}
            onClick={toggleComplete}
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
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <article className="prose prose-neutral md:prose-lg max-w-none bg-background p-8 md:p-12 rounded-xl shadow-sm border">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8 pb-8 border-b">
            {chapter?.title}
          </h1>

          {hasContent ? (
            <div className="leading-relaxed text-foreground/90">
              <PlateEditor value={value} resetKey={chapterId} readOnly />
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              This chapter has no content.
            </p>
          )}
        </article>
      </main>
    </div>
  );
}
