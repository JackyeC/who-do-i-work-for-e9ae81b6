import { Briefcase, User, Users, Brain, FileText, Building2, Lock, Crown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PersonaId, type PersonaAccessTier, PERSONAS } from "@/lib/personaConfig";
import { usePremium, STRIPE_TIERS } from "@/hooks/use-premium";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<PersonaId, React.ElementType> = {
  job_seeker: Briefcase,
  employee: User,
  recruiter: Users,
  hr_tech_buyer: Brain,
  journalist: FileText,
  employer: Building2,
};

interface PersonaSelectorProps {
  activePersona: PersonaId;
  onPersonaChange: (persona: PersonaId) => void;
}

export function PersonaSelector({ activePersona, onPersonaChange }: PersonaSelectorProps) {
  const current = PERSONAS.find(p => p.id === activePersona)!;
  const { tier, isPremium } = usePremium();
  const { user } = useAuth();
  const navigate = useNavigate();

  const tierRank = { free: 0, candidate: 1, professional: 2 };

  function canAccessPersona(accessTier: PersonaAccessTier, requiredPlan?: "candidate" | "professional"): boolean {
    if (accessTier === "free" || accessTier === "freemium") return true;
    if (!requiredPlan) return isPremium;
    return tierRank[tier] >= tierRank[requiredPlan];
  }

  function handlePersonaClick(persona: typeof PERSONAS[0]) {
    const hasAccess = canAccessPersona(persona.accessTier, persona.requiredPlan);
    
    if (!hasAccess) {
      if (!user) {
        toast.info("Sign up to access the " + persona.label + " view");
        navigate("/login");
      } else {
        const planLabel = persona.requiredPlan === "professional" ? "Professional" : "Candidate";
        toast.info(`Upgrade to ${planLabel} to unlock the ${persona.label} view`);
        navigate("/pricing");
      }
      return;
    }

    onPersonaChange(persona.id);
  }

  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">Report View</p>
      <div className="w-full grid grid-cols-6 h-auto p-1 bg-muted rounded-lg">
        {PERSONAS.map((persona) => {
          const Icon = ICONS[persona.id];
          const isActive = activePersona === persona.id;
          const hasAccess = canAccessPersona(persona.accessTier, persona.requiredPlan);
          const isLocked = persona.accessTier === "paid" && !hasAccess;

          return (
            <Tooltip key={persona.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePersonaClick(persona)}
                  className={cn(
                    "flex items-center justify-center gap-1 py-2 text-xs sm:text-xs font-medium rounded-md transition-all duration-200 relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isLocked
                        ? "text-muted-foreground/50 hover:text-muted-foreground/70"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  {isLocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">{persona.shortLabel}</span>
                  {persona.accessTier === "paid" && !isActive && (
                    <Crown className="w-2.5 h-2.5 text-civic-yellow shrink-0" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[200px]">
                {isLocked ? (
                  <span>
                    <strong>{persona.label}</strong> — Upgrade to{" "}
                    {persona.requiredPlan === "professional" ? "Executive ($999/yr)" : "Scout ($19/mo)"}{" "}
                    to unlock
                  </span>
                ) : (
                  <span>
                    <strong>{persona.label}</strong> — {persona.question}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{current.description}</p>
        <span className="text-xs font-medium text-primary whitespace-nowrap">"{current.question}"</span>
      </div>
    </div>
  );
}
