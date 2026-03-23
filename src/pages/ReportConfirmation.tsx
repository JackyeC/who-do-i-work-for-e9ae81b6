import { CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ReportConfirmation() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const product = params.get("product") || "career-fit-report";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="max-w-lg w-full border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Payment Confirmed</h1>
              <p className="text-muted-foreground leading-relaxed">
                Thank you! Your Career Fit Report is being prepared. You'll receive it at the email 
                address you provided during checkout.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="w-4 h-4 text-primary" />
                What happens next
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Our research team starts your company scan</li>
                <li>You'll receive your report within 24-48 hours</li>
                <li>Report includes compensation, culture, leadership & risk signals</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
                Back to Home
              </Button>
              <Button onClick={() => navigate("/check")} className="gap-2">
                Scan Another Company <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
