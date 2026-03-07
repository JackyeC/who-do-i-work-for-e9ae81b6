import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LENSES, type LensId } from "@/lib/lensConfig";
import { Briefcase, Heart, Scale } from "lucide-react";

const ICONS: Record<LensId, React.ElementType> = {
  influence: Briefcase,
  safety: Heart,
  values: Scale,
};

interface LensSelectorProps {
  activeLens: LensId;
  onLensChange: (lens: LensId) => void;
}

export function LensSelector({ activeLens, onLensChange }: LensSelectorProps) {
  const current = LENSES.find((l) => l.id === activeLens)!;

  return (
    <div className="mb-6">
      <Tabs
        value={activeLens}
        onValueChange={(v) => onLensChange(v as LensId)}
      >
        <TabsList className="w-full grid grid-cols-3 h-auto p-1">
          {LENSES.map((lens) => {
            const Icon = ICONS[lens.id];
            return (
              <TabsTrigger
                key={lens.id}
                value={lens.id}
                className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline">{lens.label}</span>
                <span className="sm:hidden">{lens.shortLabel}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
      <p className="text-xs text-muted-foreground mt-2">{current.description}</p>
    </div>
  );
}
