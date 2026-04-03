import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface EpisodeShellProps {
  children: ReactNode;
}

const shellVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.08 },
  },
};

const childVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export function EpisodeShell({ children }: EpisodeShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header — case file top bar */}
      <header className="border-b border-border/30 bg-card/40 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-5 py-6 text-center">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/70 mb-1.5">
            WDIWF Intelligence
          </p>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight">
            No‑Regrets Career Story
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8 bg-primary/30" />
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">
              Powered by Follow The Money
            </p>
            <div className="h-px w-8 bg-primary/30" />
          </div>
        </div>
      </header>

      {/* Main — staggered reveal */}
      <motion.main
        className="max-w-2xl mx-auto px-5 py-10 space-y-10"
        variants={shellVariants}
        initial="hidden"
        animate="visible"
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <motion.div key={i} variants={childVariant}>
                {child}
              </motion.div>
            ))
          : <motion.div variants={childVariant}>{children}</motion.div>
        }
      </motion.main>

      {/* Footer line */}
      <footer className="border-t border-border/20 py-6">
        <p className="text-center text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          Season 1 · Confidential Career Intelligence
        </p>
      </footer>
    </div>
  );
}
