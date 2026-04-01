import { useMemo } from "react";
import { motion } from "framer-motion";

const REFLECTIONS = [
  "You're not just looking for a job — you're trying to avoid a mistake.",
  "Clarity before commitment.",
  "Pay attention to what feels off — there's usually a reason.",
  "The best offer isn't always the biggest one.",
  "Trust what the data shows, not what the pitch says.",
  "You deserve to know before you go.",
  "A good company doesn't need to hide anything.",
  "Silence from leadership is still a signal.",
  "Your instincts brought you here. The data will take you further.",
  "Not every opportunity deserves your energy.",
];

function getTodayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return dayOfYear % REFLECTIONS.length;
}

export function TodayReflection() {
  const reflection = useMemo(() => REFLECTIONS[getTodayIndex()], []);

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="text-sm italic text-muted-foreground mb-6"
    >
      "{reflection}"
    </motion.p>
  );
}
