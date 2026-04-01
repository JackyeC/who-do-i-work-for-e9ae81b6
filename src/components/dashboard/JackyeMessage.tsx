import { motion } from "framer-motion";

interface JackyeMessageProps {
  firstName: string;
}

export function JackyeMessage({ firstName }: JackyeMessageProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative rounded-2xl border border-[hsl(var(--gold-border))] overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--surface-2)) 0%, hsl(var(--card)) 100%)",
        }}
      >
        {/* Warm gold radial glow — top-right */}
        <div
          className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 100% 0%, rgba(212,168,67,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Date */}
          <p className="text-xs tracking-wide text-[hsl(var(--text-tertiary))] mb-4 font-mono">
            {dateStr}
          </p>

          {/* Greeting */}
          <h2 className="text-2xl sm:text-3xl leading-tight mb-4">
            <span className="font-light text-[hsl(var(--text-secondary))]">Hey, </span>
            <span className="font-bold text-primary font-brand">{firstName}.</span>
          </h2>

          {/* Gold separator */}
          <div className="w-10 h-px bg-primary/40 mb-5" />

          {/* Personal message */}
          <p
            className="text-[15px] leading-[1.75] text-[hsl(var(--text-secondary))] max-w-[640px]"
          >
            I saw something this morning you should know about. Google just got hit with a monopoly
            ruling — and if you're interviewing anywhere in ad tech, that changes the conversation. I
            pulled the details into your dossier already. Also? That role at Lighthouse Education
            Partners — 92% alignment with your values. That's rare. I'd look twice at that one.
            <br />
            <br />
            You've put yourself out there 3 times this week. That's not nothing. That takes real
            courage, and I see you.
          </p>

          {/* Signature */}
          <p className="mt-6 text-sm font-serif italic text-[hsl(var(--text-tertiary))]">
            Always in your corner —{" "}
            <span className="font-bold text-primary not-italic font-brand">Jackye</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
