import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Context message shown above the form */
  headline?: string;
  subtext?: string;
}

export function SignupModal({
  open,
  onOpenChange,
  headline = "Unlock the full report",
  subtext = "No credit card required. Your first report is free.",
}: SignupModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "Check your email to verify, but you can start exploring now.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: mode === "signup" ? "Signup failed" : "Sign-in failed",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 gap-0">
        <DialogTitle className="font-serif text-lg text-foreground mb-1">
          {headline}
        </DialogTitle>
        <p className="text-sm text-muted-foreground mb-5">{subtext}</p>

        {/* Google SSO — primary path */}
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 mb-4 font-mono text-xs tracking-wider uppercase"
          onClick={handleGoogle}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email / Password form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="signup-email" className="sr-only">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="signup-password" className="sr-only">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="signup-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                minLength={6}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full gap-1.5 font-mono text-xs tracking-wider uppercase" disabled={submitting}>
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {mode === "signup" ? "Unlock Report" : "Sign In"} <ArrowRight className="w-3 h-3" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-primary underline underline-offset-2">
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button onClick={() => setMode("signup")} className="text-primary underline underline-offset-2">
                Create account
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
