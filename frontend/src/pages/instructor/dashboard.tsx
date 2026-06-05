import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Book, MoreVertical } from "lucide-react";
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
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Courses</h1>
          <p className="text-muted-foreground">Manage your courses and course content.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new course</DialogTitle>
              <DialogDescription>
                Provide the basic details for your new course. You can add chapters later.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Textarea placeholder="A brief overview of the course content..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Create Course</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-primary/10 p-2 rounded-md">
                    <Book className="h-5 w-5 text-primary" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <CardTitle className="text-xl line-clamp-2">{course.name}</CardTitle>
                <CardDescription className="line-clamp-3 mt-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="bg-muted/30 p-4 border-t">
                <Link href={`/instructor/courses/${course.id}`} className="w-full">
                  <Button variant="secondary" className="w-full">Manage Content</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            You haven't created any courses. Get started by creating your first course.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Course
          </Button>
        </div>
      )}
    </div>
  );
}
