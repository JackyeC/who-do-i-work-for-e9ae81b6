import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Youtube, Linkedin, Mail, Sparkles } from "lucide-react";
import { useEffect } from "react";

const SOCIAL_LINKS = {
  newsletter: "https://jackyeclayton.com/newsletter", // People Puzzles Collective
  linkedin: "https://www.linkedin.com/in/jackyeclayton/",
  youtube: "https://www.youtube.com/@JackyeClayton",
};

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg">
          {/* Success badge */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/8 flex items-center justify-center mb-4 border border-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-serif text-2xl lg:text-3xl text-foreground mb-2">
              Welcome to the People Puzzles Collective
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              You're in. Your Workplace DNA Calibration and Public Intelligence Dashboard are unlocked.
              Stay connected for weekly clarity from Jackye Clayton.
            </p>
          </div>

          {/* The Follow Loop */}
          <div className="bg-card border border-border p-6 mb-6">
            <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">
              Stay in the loop
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Get the truth about the market delivered to your inbox every Monday.
              Follow Jackye for daily career clarity.
            </p>

            <div className="space-y-3">
              <a
                href={SOCIAL_LINKS.newsletter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-primary text-primary-foreground p-4 hover:brightness-110 transition-all group"
              >
                <Mail className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <div className="font-mono text-xs tracking-wider uppercase font-semibold">
                    Join Monday Momentum
                  </div>
                  <div className="text-xs opacity-80">
                    Weekly career intelligence newsletter
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card border border-border p-4 hover:border-primary/40 transition-all group"
              >
                <Linkedin className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="font-mono text-xs tracking-wider uppercase font-semibold text-foreground">
                    Follow on LinkedIn
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Daily clarity from Jackye Clayton
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </a>

              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-card border border-border p-4 hover:border-primary/40 transition-all group"
              >
                <Youtube className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="font-mono text-xs tracking-wider uppercase font-semibold text-foreground">
                    Subscribe on YouTube
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @JackyeClayton — career intelligence videos
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
              </a>
            </div>
          </div>

          {/* What's unlocked */}
          <div className="bg-card border border-border p-6 mb-6">
            <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-4">
              What you've unlocked
            </div>
            <ul className="space-y-2.5">
              {[
                "Workplace DNA Calibration",
                "Public Intelligence Dashboard",
                "3 free company scans per month",
                "Monday Momentum newsletter",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate("/career-map")}
              className="flex-1 gap-1.5 font-mono text-xs tracking-wider uppercase"
            >
              Calibrate My DNA <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex-1 gap-1.5 font-mono text-xs tracking-wider uppercase"
            >
              Go to Dashboard <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
