import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";

interface SignupGateProps {
  /** What the user is trying to access */
  feature: string;
  /** Optional: show a preview above the gate */
  children?: React.ReactNode;
  /** If true, show the gate overlay on top of blurred children */
  blurPreview?: boolean;
}

/**
 * Signup gate — shows a conversion prompt for unauthenticated users.
 * For authenticated users, renders nothing (children pass through in parent).
 * Use this to gate high-value pages behind free account creation.
 */
export function SignupGate({ feature, children, blurPreview = true }: SignupGateProps) {
  const { user } = useAuth();

  // Authenticated users never see this
  if (user) return null;

  return (
    <div className="relative">
      {/* Blurred preview of content behind the gate */}
      {children && blurPreview && (
        <div className="pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.5, maxHeight: "400px", overflow: "hidden" }}>
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <div className={`${children && blurPreview ? "absolute inset-0" : ""} pointer-events-none flex items-center justify-center`}>
        <div className="pointer-events-auto bg-card border border-border/40 rounded-2xl p-8 max-w-md mx-auto text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-primary" />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2">
            Sign up to access {feature}
          </h3>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Create a free account to unlock the full view. No credit card required.
            Join thousands of workers who refuse to find out the hard way.
          </p>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
            style={{
              backgroundColor: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="text-xs text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
