import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  PlateEditor,
  EMPTY_VALUE,
  normalizePlateValue,
  type PlateValue,
} from "@/components/plate-editor";

export default function ChapterEditor() {
  const params = useParams();
  const { courseId, chapterId } = params;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [value, setValue] = useState<PlateValue>(EMPTY_VALUE);

  // Latest editor value (avoids re-render on every keystroke).
  const valueRef = useRef<PlateValue>(EMPTY_VALUE);

  const fetchChapter = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/chapters/${chapterId}/`);
      const chapter = response.data;
      setTitle(chapter.title);
      setIsPublic(chapter.visibility === "public");
      const normalized = normalizePlateValue(chapter.content);
      setValue(normalized);
      valueRef.current = normalized;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load chapter.",
      });
      setLocation(`/instructor/courses/${courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && chapterId) {
      fetchChapter();
    }
  }, [courseId, chapterId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.patch(`/courses/${courseId}/chapters/${chapterId}/`, {
        title,
        visibility: isPublic ? "public" : "private",
        content: valueRef.current,
      });
      toast({
        title: "Saved",
        description: "Chapter has been updated successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "There was a problem saving your chapter.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r bg-muted/10 p-6 flex flex-col shrink-0 overflow-y-auto">
        <div className="mb-6">
          <Link
            href={`/instructor/courses/${courseId}`}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Link>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <Label htmlFor="title">Chapter Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
            <div className="space-y-0.5">
              <Label className="text-base">Visibility</Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? "Students can see this." : "Hidden from students."}
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
        </div>

        <div className="pt-6 mt-auto border-t">
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-background overflow-y-auto">
        <div className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full">
          <PlateEditor
            value={value}
            resetKey={chapterId}
            onChange={(v) => {
              valueRef.current = v;
            }}
            placeholder="Write your chapter content here…"
          />
        </div>
      </div>
    </div>
  );
}
