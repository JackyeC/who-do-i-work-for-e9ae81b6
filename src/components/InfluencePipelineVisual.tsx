import { motion } from "framer-motion";
import { DollarSign, Network, Landmark, ArrowRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08 },
  }),
};

const pipelineSteps = [
  {
    icon: DollarSign,
    label: "Money In",
    color: "text-civic-gold",
    bgColor: "bg-civic-gold/10 border-civic-gold/20",
    items: ["PAC contributions", "Executive donations", "Lobbying expenditures", "Trade association dues"],
  },
  {
    icon: Network,
    label: "Influence Network",
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    items: ["Committee members", "Revolving door officials", "Advisory appointments", "Interlocking boards"],
  },
  {
    icon: Landmark,
    label: "Benefits Out",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
    items: ["Government contracts", "Subsidies & grants", "Favorable regulations", "Policy outcomes"],
  },
];

export function InfluencePipelineVisual() {
  return (
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="gold-line w-16 mx-auto mb-8" />
            <h2 className="text-headline text-foreground mb-4 font-display">
              Follow the Influence
            </h2>
            <p className="text-body-lg text-muted-foreground max-w-xl mx-auto">
              See how political spending flows from companies through influence networks to government outcomes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connection arrows (desktop only) */}
            <div className="hidden md:block absolute top-1/2 left-[33.33%] -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-8 h-8 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-elevated">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 left-[66.66%] -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="w-8 h-8 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-elevated">
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {pipelineSteps.map((step, i) => (
              <motion.div
                key={step.label}
                variants={fadeUp}
                custom={i + 1}
                className={`rounded-2xl border p-6 ${step.bgColor} relative`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-card/80 border border-border/40 flex items-center justify-center shadow-sm">
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-display">{step.label}</h3>
                </div>
                <ul className="space-y-2">
                  {step.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`w-1.5 h-1.5 rounded-full ${step.color.replace("text-", "bg-")} opacity-60`} />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Mobile arrow */}
                {i < pipelineSteps.length - 1 && (
                  <div className="md:hidden flex justify-center my-3">
                    <div className="w-6 h-6 rounded-full bg-card border border-border/60 flex items-center justify-center rotate-90">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
