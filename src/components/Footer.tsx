import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { LogoMark } from "@/components/brand/LogoMark";
import { ArrowRight } from "lucide-react";

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer
      ref={ref}
      className="mt-auto"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'hsl(var(--background))',
      }}
    >
      {/* Jackye CTA strip */}
      <div
        className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-8 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--foreground))', lineHeight: 1.5 }}>
          You deserve to know exactly who you work for.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/intelligence-check"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all hover:brightness-110"
            style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            Start Your Audit <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/ask-jackye"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-colors hover:brightness-110"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
          >
            Ask Jackye
          </Link>
        </div>
      </div>

      {/* Links + Legal */}
      <div className="px-6 sm:px-8 py-5 flex flex-col gap-3">
        {/* Row 1 — Brand + Links */}
        <div className="flex items-center justify-between flex-wrap gap-3 sm:flex-row flex-col sm:items-center items-start">
          <div className="flex items-center gap-2">
            <LogoMark showWordmark iconSize={18} />
            <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 400, fontSize: '0.85rem' }}> · by Jackye Clayton</span>
          </div>
          <nav className="flex items-center flex-wrap gap-5">
            {[
              { label: 'Methodology', to: '/methodology' },
              { label: 'Privacy', to: '/privacy' },
              { label: 'Terms', to: '/terms' },
              { label: 'Contact', to: '/contact' },
              { label: 'Sitemap', to: '/site-map' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors"
                style={{ fontSize: 13, fontWeight: 400, color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#b8b4a8')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Row 2 — Neutrality statement */}
        <p style={{ fontSize: 12, fontWeight: 400, color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, maxWidth: 640 }}>
          Who Do I Work For does not evaluate the content of your mission. We evaluate whether you're living it.
          Every mission category is verified the same way — against public data, not our opinion.
          We don't have a bias. We have receipts.
        </p>

        {/* Row 3 — Copyright */}
        <p style={{ fontSize: 12, fontWeight: 400, color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
          © {new Date().getFullYear()} Who Do I Work For? — Public records only. We connect the dots; you make the call.
        </p>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
