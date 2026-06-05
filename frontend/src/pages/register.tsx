import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BookOpen, GraduationCap, Presentation, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["instructor", "student"]),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "student",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      await api.post("/auth/register/", values);
      
      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials.",
      });
      setLocation("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.response?.data?.detail || "Please check your information and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-full shadow-md">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
          <p className="text-muted-foreground mt-2">Sign up to start learning or teaching</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => form.setValue("role", "student")}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                    selectedRole === "student" 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {selectedRole === "student" && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                  <GraduationCap className={`h-8 w-8 mb-2 ${selectedRole === "student" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold ${selectedRole === "student" ? "text-primary" : "text-foreground"}`}>Student</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">I want to learn</span>
                </div>
                
                <div 
                  onClick={() => form.setValue("role", "instructor")}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                    selectedRole === "instructor" 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {selectedRole === "instructor" && <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                  <Presentation className={`h-8 w-8 mb-2 ${selectedRole === "instructor" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-semibold ${selectedRole === "instructor" ? "text-primary" : "text-foreground"}`}>Instructor</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">I want to teach</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" className="bg-slate-50 border-slate-200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" className="bg-slate-50 border-slate-200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" className="bg-slate-50 border-slate-200" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white shadow-sm mt-4" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
