import { Briefcase, User, Users, Brain, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PersonaId, PERSONAS } from "@/lib/personaConfig";

const ICONS: Record<PersonaId, React.ElementType> = {
  job_seeker: Briefcase,
  employee: User,
  recruiter: Users,
  hr_tech_buyer: Brain,
  journalist: FileText,
};

interface PersonaSelectorProps {
  activePersona: PersonaId;
  onPersonaChange: (persona: PersonaId) => void;
}

export function PersonaSelector({ activePersona, onPersonaChange }: PersonaSelectorProps) {
  const current = PERSONAS.find(p => p.id === activePersona)!;

  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-2">Report View</p>
      <Tabs value={activePersona} onValueChange={(v) => onPersonaChange(v as PersonaId)}>
        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
          {PERSONAS.map((persona) => {
            const Icon = ICONS[persona.id];
            return (
              <TabsTrigger
                key={persona.id}
                value={persona.id}
                className="flex items-center gap-1.5 py-2 text-[10px] sm:text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden md:inline">{persona.label}</span>
                <span className="md:hidden">{persona.shortLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{current.description}</p>
        <span className="text-xs font-medium text-primary whitespace-nowrap">"{current.question}"</span>
      </div>
    </div>
  );
}
