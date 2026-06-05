import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Book, MoreVertical, LayoutDashboard } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(3, "Name is required"),
  description: z.string().min(10, "Description should be longer"),
});

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses/");
      setCourses(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch courses.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await api.post("/courses/", values);
      toast({ title: "Success", description: "Course created successfully." });
      setIsDialogOpen(false);
      form.reset();
      fetchCourses();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create course.",
      });
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 lg:px-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and learning materials.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a new course</DialogTitle>
              <DialogDescription>
                Provide the basic details for your new course. You can add chapters later.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Introduction to Biology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief overview of the course content..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6">
                  <Button type="submit" className="w-full">Create Course</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-5">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="p-4 border-t bg-slate-50/50">
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const gradients = [
              'from-blue-400 to-indigo-600',
              'from-emerald-400 to-teal-600',
              'from-violet-400 to-purple-600',
              'from-orange-400 to-red-500',
              'from-pink-400 to-rose-600'
            ];
            const bgGradient = gradients[index % gradients.length];
            
            return (
              <Card key={course.id} className="flex flex-col overflow-hidden bg-white shadow-sm border hover:shadow-md transition-all duration-200 rounded-xl">
                <div className={`h-36 w-full bg-gradient-to-r ${bgGradient}`} />
                <CardHeader className="pb-4 flex-1">
                  <CardTitle className="text-lg font-semibold line-clamp-2">{course.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 text-sm text-muted-foreground">
                    {course.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      Instructor
                    </span>
                  </div>
                </CardHeader>
                <CardFooter className="bg-white p-4 border-t">
                  <Link href={`/instructor/courses/${course.id}`} className="w-full">
                    <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 hover:text-foreground">
                      Manage Course
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed shadow-sm">
          <LayoutDashboard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't created any courses. Get started by creating your first course.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Course
          </Button>
        </div>
      )}
    </div>
  );
}
