import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Plus, Eye, EyeOff, FileText, Pencil, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const chapterSchema = z.object({
  title: z.string().min(3, "Title is required"),
});

const courseSchema = z.object({
  name: z.string().min(3, "Course name is required"),
  description: z.string().min(0),
});

export default function CourseDetail() {
  const params = useParams();
  const courseId = params.id;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isCourseEditOpen, setIsCourseEditOpen] = useState(false);
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);
  const [deletingChapterId, setDeletingChapterId] = useState<number | null>(null);

  const chapterForm = useForm<z.infer<typeof chapterSchema>>({
    resolver: zodResolver(chapterSchema),
    defaultValues: { title: "" },
  });

  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: { name: "", description: "" },
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [courseRes, chaptersRes, studentsRes] = await Promise.all([
        api.get(`/courses/${courseId}/`),
        api.get(`/courses/${courseId}/chapters/`),
        api.get(`/courses/${courseId}/students/`),
      ]);
      setCourse(courseRes.data);
      setChapters(chaptersRes.data);
      setStudents(studentsRes.data);
      courseForm.reset({
        name: courseRes.data.name ?? "",
        description: courseRes.data.description ?? "",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load course details.",
      });
      setLocation("/instructor");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchData();
  }, [courseId]);

  async function onAddChapter(values: z.infer<typeof chapterSchema>) {
    try {
      const response = await api.post(`/courses/${courseId}/chapters/`, values);
      toast({ title: "Chapter created" });
      setIsChapterDialogOpen(false);
      chapterForm.reset();
      setLocation(`/instructor/courses/${courseId}/chapters/${response.data.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create chapter.",
      });
    }
  }

  async function onSaveCourse(values: z.infer<typeof courseSchema>) {
    try {
      await api.patch(`/courses/${courseId}/`, values);
      toast({ title: "Course updated" });
      setIsCourseEditOpen(false);
      await fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update course.",
      });
    }
  }

  async function onDeleteCourse() {
    try {
      await api.delete(`/courses/${courseId}/`);
      toast({ title: "Course deleted" });
      setLocation("/instructor");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete course.",
      });
    }
  }

  async function onDeleteChapter(chapterId: number) {
    try {
      await api.delete(`/courses/${courseId}/chapters/${chapterId}/`);
      toast({ title: "Chapter deleted" });
      setDeletingChapterId(null);
      await fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete chapter.",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-20 w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/instructor"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{course?.name}</h1>
          <p className="text-muted-foreground max-w-2xl">{course?.description}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Edit course */}
          <Dialog open={isCourseEditOpen} onOpenChange={setIsCourseEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit course</DialogTitle>
                <DialogDescription>
                  Update the course name and description.
                </DialogDescription>
              </DialogHeader>
              <Form {...courseForm}>
                <form
                  onSubmit={courseForm.handleSubmit(onSaveCourse)}
                  className="space-y-4"
                >
                  <FormField
                    control={courseForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={courseForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete course */}
          <AlertDialog
            open={confirmDeleteCourse}
            onOpenChange={setConfirmDeleteCourse}
          >
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDeleteCourse(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this course?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the course and all of its chapters.
                  Students who joined will lose access. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteCourse}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete course
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Add chapter */}
          <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Chapter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new chapter</DialogTitle>
                <DialogDescription>
                  Create a new chapter for this course. You can write the content next.
                </DialogDescription>
              </DialogHeader>
              <Form {...chapterForm}>
                <form
                  onSubmit={chapterForm.handleSubmit(onAddChapter)}
                  className="space-y-4"
                >
                  <FormField
                    control={chapterForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chapter Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Chapter 1: Getting Started" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Chapter</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 bg-muted/30 border-b">
          <h2 className="font-semibold">Course Curriculum</h2>
        </div>

        {chapters.length > 0 ? (
          <div className="divide-y">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{chapter.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {chapter.visibility === "public" ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          <Eye className="mr-1 h-3 w-3" /> Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs font-normal">
                          <EyeOff className="mr-1 h-3 w-3" /> Private
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/instructor/courses/${courseId}/chapters/${chapter.id}`}
                  >
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingChapterId(chapter.id)}
                    aria-label={`Delete chapter ${chapter.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
            <FileText className="h-10 w-10 mb-3 opacity-20" />
            <p>No chapters yet.</p>
            <p className="text-sm mt-1">
              Click "Add Chapter" to start building your course.
            </p>
          </div>
        )}
      </div>

      {/* Enrolled students */}
      <div className="bg-card border rounded-lg overflow-hidden mt-8">
        <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Enrolled students
          </h2>
          <span className="text-sm text-muted-foreground">
            {students.length} {students.length === 1 ? "student" : "students"}
          </span>
        </div>

        {students.length > 0 ? (
          <div className="divide-y">
            {students.map((row) => {
              const initials = (row.student?.username || "?")
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={row.id}
                  className="p-4 flex items-center gap-4 hover:bg-muted/10 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {row.student?.username}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {row.student?.email}
                    </div>
                  </div>
                  <div className="w-40 shrink-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>
                        {row.progress.completed}/{row.progress.total}
                      </span>
                      <span>{row.progress.percent}%</span>
                    </div>
                    <Progress value={row.progress.percent} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <Users className="h-8 w-8 mb-3 opacity-20" />
            <p className="text-sm">No students have joined yet.</p>
          </div>
        )}
      </div>

      {/* Delete chapter confirmation */}
      <AlertDialog
        open={deletingChapterId !== null}
        onOpenChange={(open) => !open && setDeletingChapterId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the chapter and its content. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingChapterId && onDeleteChapter(deletingChapterId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
