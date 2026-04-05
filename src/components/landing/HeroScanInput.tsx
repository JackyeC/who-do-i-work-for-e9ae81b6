import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Upload, ArrowRight, FileText, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTurnstile } from "@/hooks/useTurnstile";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { useScanUsage } from "@/hooks/use-scan-usage";
import { toast } from "sonner";

export function HeroScanInput() {
  const [query, setQuery] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [mode, setMode] = useState<"search" | "upload">("search");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const { containerRef, getToken, resetToken } = useTurnstile();
  const { hasScansRemaining, scansRemaining, recordScan, FREE_SCAN_LIMIT } = useScanUsage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasScansRemaining) {
      toast.error("You have used all 3 free scans. Sign up to continue.");
      navigate("/auth");
      return;
    }

    if (mode === "search" && !query.trim()) return;
    if (mode === "upload" && !file) return;

    setVerifying(true);
    try {
      const token = await getToken();
      if (token) {
        const verified = await verifyTurnstileToken(token);
        resetToken();
        if (!verified) {
          setVerifying(false);
          return;
        }
      }
    } catch (err) {
      console.warn("[HeroScanInput] Turnstile verification skipped:", err);
    }
    setVerifying(false);

    try {
      if (mode === "search") {
        await recordScan("company", query.trim());
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      } else {
        await recordScan("offer", file?.name);
        navigate("/offer-check", { state: { uploadedFile: file } });
      }
    } catch (err) {
      console.warn("[HeroScanInput] Scan record failed, navigating anyway:", err);
      if (mode === "search") {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      } else {
        navigate("/offer-check", { state: { uploadedFile: file } });
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
      setMode("upload");
    } else {
      toast.error("Please upload a PDF file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMode("upload");
    }
  };

  const suggestions = ["SpaceX", "Amazon", "Goldman Sachs", "Meta"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-[560px]"
    >
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => { setMode("search"); setFile(null); }}
          className={`font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 transition-all ${
            mode === "search"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          <Search className="w-3 h-3 inline mr-1.5" />Search Company
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 transition-all ${
            mode === "upload"
              ? "bg-primary/15 text-primary border border-primary/30"
              : "text-muted-foreground hover:text-foreground border border-transparent"
          }`}
        >
          <Upload className="w-3 h-3 inline mr-1.5" />Upload Offer
        </button>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { setDragOver(false); handleFileDrop(e); }}
        className="relative group"
      >
        <div ref={containerRef} />
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />

        <AnimatePresence mode="wait">
          {mode === "search" ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex items-center bg-card border border-border focus-within:border-primary/40 transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any employer..."
                className="flex-1 bg-transparent px-3 py-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-sans"
              />
              <button
                type="submit"
                disabled={verifying || !query.trim()}
                className="mr-2 px-5 py-2 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Run My Free Scan <ArrowRight className="w-3 h-3" /></>}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`relative bg-card border border-dashed transition-colors p-4 ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
            >
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-foreground font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground p-1">
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="px-5 py-2 bg-primary text-primary-foreground font-mono text-xs tracking-wider uppercase font-semibold hover:brightness-110 active:scale-[0.97] transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <>Analyze Offer <ArrowRight className="w-3 h-3" /></>}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-2"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drop a PDF offer letter here, or click to browse</p>
                  <p className="text-xs text-muted-foreground/50">PDF only, max 20MB</p>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Suggestions (search mode only) */}
      {mode === "search" && (
        <div className="flex items-center gap-2 mt-3">
          <span className="font-mono text-xs tracking-wider uppercase text-muted-foreground/60">Try:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuery(s);
                setTimeout(() => {
                  formRef.current?.requestSubmit();
                }, 150);
              }}
              className="font-mono text-xs tracking-wider text-muted-foreground hover:text-primary active:scale-95 active:bg-primary/20 transition-all cursor-pointer rounded px-1 py-0.5"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Scan counter for non-authenticated users */}
      {!hasScansRemaining ? null : scansRemaining < FREE_SCAN_LIMIT && (
        <p className="font-mono text-[10px] text-muted-foreground/60 mt-3 text-center tracking-wider">
          {scansRemaining} of {FREE_SCAN_LIMIT} free scans remaining
        </p>
      )}
    </motion.div>
  );
}
