'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    }
  }, [user, router, searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    if (mode === "signup") {
      const { error } = await signUp(email, password, name);
      
      if (error) {
        setLoading(false);
        
        if (error.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Try signing in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error creating account",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account, or you may be logged in automatically.",
      });
    } else {
      const { error } = await signIn(email, password);
      
      if (error) {
        setLoading(false);
        
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "The email or password you entered is incorrect.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error signing in",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      
      toast({
        title: "Welcome back!",
        description: "Redirecting to dashboard...",
      });
      
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.push(redirect);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
            
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Phone className="h-4 w-4 text-background" />
              </div>
              <span className="text-lg font-semibold">CallTrack</span>
            </Link>

            <h1 className="text-2xl font-bold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "signup"
                ? "Start your free 14-day trial"
                : "Sign in to your account"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="mt-1"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="you@company.com"
                required
                className={`mt-1 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                required
                className={`mt-1 ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Loading..."
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            {mode === "signup" ? (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-foreground font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-foreground font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-card border-l border-border items-center justify-center p-12">
        <div className="max-w-md">
          <blockquote className="text-xl font-medium mb-6 text-foreground">
            &ldquo;CallTrack helped us attribute 40% more conversions to our paid campaigns. The ROI insights are invaluable.&rdquo;
          </blockquote>
          <div>
            <p className="font-semibold text-foreground">Sarah Chen</p>
            <p className="text-muted-foreground">Marketing Director, GrowthLab Agency</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}

