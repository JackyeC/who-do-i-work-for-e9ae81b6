import type { PVSResult } from "@/lib/promotionVelocityScore";

export function ScoreBreakdownTable({ breakdown }: { breakdown: PVSResult["breakdown"] }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-left">
            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">Component</th>
            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right">Weight</th>
            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right">Raw</th>
            <th className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right">Weighted</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((row) => (
            <tr key={row.component} className="border-t border-border">
              <td className="px-3 py-2 text-foreground font-medium">{row.component}</td>
              <td className="px-3 py-2 text-muted-foreground text-right">{Math.round(row.weight * 100)}%</td>
              <td className="px-3 py-2 text-foreground text-right tabular-nums">{row.raw}</td>
              <td className="px-3 py-2 text-foreground font-semibold text-right tabular-nums">{row.weighted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
