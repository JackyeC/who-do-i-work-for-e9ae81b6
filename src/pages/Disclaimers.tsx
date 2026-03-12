import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldAlert, Bot, Database, UserCheck, Scale, FileText, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    icon: ShieldAlert,
    title: "1. Educational Disclaimer",
    content: `This platform provides informational insights and educational analysis to help users review employment offers and company data. It is not a law firm and does not provide legal advice. Nothing on this platform should be interpreted as legal advice or as a substitute for consulting a qualified attorney.\n\nUse of this platform does not create an attorney-client relationship.\n\nUsers should independently verify all information and seek professional legal advice before making employment decisions.`,
  },
  {
    icon: Bot,
    title: "2. Automated Analysis Notice",
    content: `Offer evaluations and company insights are generated through automated systems using publicly available data and document analysis. While the platform aims to provide helpful insights, automated analysis may contain errors, omissions, or incomplete interpretations.\n\nUsers should review all employment documents carefully and consult professional advisors when appropriate.`,
  },
  {
    icon: Database,
    title: "3. Data Sources and Accuracy",
    content: `Company insights presented on this platform are derived from publicly available datasets, including government filings (FEC, SEC, OSHA, NLRB, EPA), regulatory databases, and independent research organizations.\n\nWhile reasonable efforts are made to present accurate and current information, the platform cannot guarantee completeness or accuracy of third-party data sources.\n\nAll company assessments represent algorithmic interpretations of available information.`,
  },
  {
    icon: UserCheck,
    title: "4. User Decision Responsibility",
    content: `All career and employment decisions remain the sole responsibility of the user. The platform provides informational insights to assist in evaluating employment opportunities but does not recommend specific decisions or outcomes.`,
  },
  {
    icon: Scale,
    title: "5. Limitation of Liability",
    content: `To the fullest extent permitted by law, the platform and its operators shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of the platform or reliance on any information provided.\n\nUse of the platform is at the user's own risk.`,
  },
  {
    icon: FileText,
    title: "6. Document Processing Notice",
    content: `Uploaded documents are processed automatically to generate insights. Documents may be temporarily stored for analysis purposes and are handled according to the platform's privacy policy. Users retain the right to delete their data at any time.\n\nWe do not use your private documents to train AI models.\n\nUsers should avoid uploading documents that contain information they are not authorized to share.`,
  },
  {
    icon: BarChart3,
    title: "7. Analytical Scoring Notice",
    content: `Scores and ratings presented on the platform — including the Offer Strength Score™, Career Alignment Score™, and Civic Footprint Score — represent analytical interpretations of available data and user preferences. These scores are intended to provide context and insight rather than definitive judgments about any company or employer.`,
  },
];

const Disclaimers = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-3 font-display">Disclaimers & Legal Notices</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Last updated: March 12, 2026 · Created by Jackye Clayton
      </p>

      <div className="space-y-10">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <section key={s.title} className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4.5 h-4.5 text-primary shrink-0" />
                <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
              </div>
              {s.content.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{para}</p>
              ))}
            </section>
          );
        })}
      </div>

      <div className="mt-14 pt-8 border-t border-border/40 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Related Legal Pages</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/terms" className="text-sm text-primary hover:underline">Terms of Service</Link>
          <Link to="/privacy" className="text-sm text-primary hover:underline">Privacy Policy</Link>
          <Link to="/methodology" className="text-sm text-primary hover:underline">Methodology</Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Disclaimers;
