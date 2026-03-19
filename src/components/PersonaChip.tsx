import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePersona, PERSONA_NAMES, type PersonaId } from "@/hooks/use-persona";

const ALL_PERSONAS = Object.entries(PERSONA_NAMES) as [PersonaId, string][];

export function PersonaChip() {
  const { persona, personaName, hasTakenQuiz, setPersona } = usePersona();
  const [open, setOpen] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSwitch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!hasTakenQuiz) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setShowSwitch(false); }}
        className="inline-flex items-center gap-1.5 rounded-[20px] px-3 py-[5px] cursor-pointer transition-colors hover:brightness-110"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "11px",
          fontWeight: 500,
          color: "#f0c040",
          background: "rgba(240,192,64,0.1)",
          border: "1px solid rgba(240,192,64,0.3)",
        }}
      >
        Viewing as: {personaName}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 overflow-hidden"
          style={{
            width: "220px",
            background: "#1a1826",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
          }}
        >
          {!showSwitch ? (
            <div className="py-1">
              <Link
                to="/quiz"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#f0ebe0" }}
              >
                Retake the quiz
              </Link>
              <button
                onClick={() => setShowSwitch(true)}
                className="block w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                style={{ fontFamily: "'DM Sans', sans-serif", color: "#f0ebe0" }}
              >
                Switch lens manually
              </button>
            </div>
          ) : (
            <div className="py-1 max-h-[300px] overflow-y-auto">
              {ALL_PERSONAS.map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => {
                    setPersona(id);
                    setOpen(false);
                    setShowSwitch(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: id === persona ? "#f0c040" : "#f0ebe0",
                    fontWeight: id === persona ? 600 : 400,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
