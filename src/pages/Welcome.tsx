import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { useEffect } from "react";
import { WelcomeLiveTicker } from "@/components/welcome/WelcomeLiveTicker";

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const capabilities = [
    "Run real company checks before you apply or accept",
    "Spot risk signals most candidates miss",
    "Compare what companies say vs what they actually do",
    "Ask better questions in interviews",
    "Make decisions based on evidence, not guesswork",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-xl text-center">
          {/* Headline */}
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-foreground leading-tight mb-4">
            You're in. Now let's make sure you don't walk into the wrong company.
          </h1>

          {/* Subhead */}
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg mx-auto mb-10">
            Most people accept jobs based on titles, salary, and vibes. You now have the ability to see what's actually happening behind the offer.
          </p>

          {/* Primary CTA */}
          <Button
            onClick={() => navigate("/search")}
            size="lg"
            className="gap-2 font-mono text-sm tracking-wider uppercase px-10 py-6 text-base"
          >
            <Search className="w-5 h-5" />
            Scan a Company
          </Button>

          {/* Live ticker */}
          <div className="mt-5 mb-3">
            <WelcomeLiveTicker />
          </div>

          {/* Supporting text */}
          <p className="font-mono text-xs text-muted-foreground/70 tracking-wide mb-10">
            Most candidates never see this before they accept. You will.
          </p>

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Button
              variant="outline"
              onClick={() => navigate("/career-map")}
              className="gap-1.5 font-mono text-xs tracking-wider uppercase"
            >
              Calibrate My Workplace DNA <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="gap-1.5 font-mono text-xs tracking-wider uppercase"
            >
              Go to Dashboard <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {/* What you can do now */}
          <div className="bg-card border border-border p-6 sm:p-8 text-left max-w-md mx-auto">
            <div className="font-mono text-xs tracking-[0.2em] uppercase text-primary mb-5">
              What you can do now
            </div>
            <ul className="space-y-3">
              {capabilities.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
