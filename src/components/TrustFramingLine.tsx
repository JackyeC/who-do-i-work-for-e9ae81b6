import { usePersona } from "@/hooks/use-persona";

export function TrustFramingLine() {
  const { trustFraming } = usePersona();
  if (!trustFraming) return null;

  return (
    <p
      className="mb-4"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "12px",
        color: "hsl(var(--muted-foreground))",
      }}
    >
      {trustFraming}
    </p>
  );
}
