import { forwardRef } from "react";
import { Link } from "react-router-dom";

export const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer
      ref={ref}
      className="mt-auto"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 32px',
        background: 'hsl(var(--background))',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Row 1 — Brand + Links */}
      <div className="flex items-center justify-between flex-wrap gap-3 sm:flex-row flex-col sm:items-center items-start">
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f0ebe0', letterSpacing: '-0.25px' }}>
            WDIWF
          </span>
          <span style={{ fontSize: 13, fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>
            by Jackye Clayton
          </span>
        </div>
        <nav className="flex items-center flex-wrap gap-5 sm:gap-5" style={{ gap: undefined }}>
          {[
            { label: 'Methodology', to: '/methodology' },
            { label: 'Privacy', to: '/privacy' },
            { label: 'Terms', to: '/terms' },
            { label: 'Corrections', to: '/request-correction' },
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

      {/* Row 2 — Copyright */}
      <p style={{ fontSize: 12, fontWeight: 400, color: '#3d3a4a', lineHeight: 1.5 }}>
        © {new Date().getFullYear()} Who Do I Work For? — Public records only. We connect the dots; you make the call.
      </p>
    </footer>
  );
});

Footer.displayName = "Footer";
