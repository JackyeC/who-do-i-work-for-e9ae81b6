import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Shield, ArrowRight } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      navigate("/voter-lookup");
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({
        title: "Sign-in failed",
        description: error.message || "Could not sign in with Google.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/8 flex items-center justify-center mb-2 border border-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-headline text-2xl">Sign in to Offer Check</CardTitle>
            <p className="text-body text-muted-foreground leading-relaxed">
              Access premium features like "Who Do I Work For?" — see exactly which corporations fund your elected representatives.
            </p>
          </CardHeader>
          <CardContent className="space-y-5 pt-0">
            <Button
              onClick={handleGoogleSignIn}
              className="w-full gap-2.5 h-12 text-base"
              size="lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
            <p className="text-micro text-center text-muted-foreground">
              By signing in, you agree to our terms of service. We only use your email to personalize your experience.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
