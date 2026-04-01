import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, Bookmark, Loader2 } from "lucide-react";
import { fetchDailyNote, saveNote, type DailyNoteResponse } from "@/services/JackyeNoteService";
import { toast } from "sonner";

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

  const [noteResponse, setNoteResponse] = useState<DailyNoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDailyNote().then((res) => {
      if (!cancelled) {
        setNoteResponse(res);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleLike = async () => {
    if (!noteResponse || liked) return;
    setLiked(true);
    await saveNote(noteResponse.note, noteResponse.noteData, true);
    toast.success("Note liked — saved to your intel.");
  };

  const handleSave = async () => {
    if (!noteResponse || saved) return;
    setSaved(true);
    await saveNote(noteResponse.note, noteResponse.noteData, false);
    toast.success("Note saved to My Intel.");
  };

  // Split note into paragraphs for rendering
  const paragraphs = noteResponse?.note
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean) || [];

  // Separate signature from body
  const signatureIdx = paragraphs.findIndex((p) => p.startsWith("Always in your corner"));
  const bodyParagraphs = signatureIdx >= 0 ? paragraphs.slice(0, signatureIdx) : paragraphs;
  const hasSignature = signatureIdx >= 0;

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
        {/* Warm gold radial glow */}
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

          {/* Dynamic message */}
          {loading ? (
            <div className="flex items-center gap-3 py-6">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Checking signals...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4 max-w-[640px]">
                {bodyParagraphs.map((p, i) => (
                  <p
                    key={i}
                    className="text-[15px] leading-[1.75] text-[hsl(var(--text-secondary))]"
                  >
                    {p}
                  </p>
                ))}
              </div>

              {/* Signature */}
              {hasSignature && (
                <p className="mt-6 text-sm font-serif italic text-[hsl(var(--text-tertiary))]">
                  Always in your corner —{" "}
                  <span className="font-bold text-primary not-italic font-brand">Jackye</span>
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border/20">
                <button
                  onClick={handleLike}
                  disabled={liked}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? "fill-primary text-primary" : ""}`} />
                  {liked ? "Liked" : "Like"}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${saved ? "fill-primary text-primary" : ""}`} />
                  {saved ? "Saved" : "Save to My Intel"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
