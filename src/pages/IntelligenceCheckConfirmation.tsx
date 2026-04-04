import { CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function IntelligenceCheckConfirmation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email") || "the email you provided";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>Request Received — Who Do I Work For</title>
      </Helmet>
      <MarketingNav />

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="max-w-lg w-full border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">We've got your request.</h1>
              <p className="text-muted-foreground leading-relaxed">
                Thanks for trusting us with your career decision. We'll send your WDIWF snapshot to{" "}
                <span className="font-medium text-foreground">{email}</span> within 2–3 business days.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4 text-primary" />
                What happens next
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Jackyé personally reviews your request</li>
                <li>We scan public records: layoffs, lawsuits, political spending, CEO pay, and more</li>
                <li>You'll receive an intelligence snapshot by email</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
                Back to Home
              </Button>
              <Button onClick={() => navigate("/intelligence-check")} className="gap-2">
                Check Another Employer <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}
