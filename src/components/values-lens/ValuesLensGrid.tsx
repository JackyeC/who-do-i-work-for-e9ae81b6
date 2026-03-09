import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { VALUES_LENSES, type ValuesLensKey } from "@/lib/valuesLenses";
import { Badge } from "@/components/ui/badge";

interface Props {
  counts?: Record<string, number>;
  onSelect: (key: ValuesLensKey) => void;
}

export function ValuesLensGrid({ counts, onSelect }: Props) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {VALUES_LENSES.map((lens, i) => {
        const Icon = lens.icon;
        const count = counts?.[lens.key] || 0;
        return (
          <motion.button
            key={lens.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.4 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(lens.key as ValuesLensKey)}
            className="text-left p-5 rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-elevated transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm mb-1">{lens.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{lens.description}</p>
                {count > 0 && (
                  <Badge variant="secondary" className="mt-2 text-[10px]">
                    {count} signal{count !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
