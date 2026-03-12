import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
      <div className="prose prose-sm text-muted-foreground space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: March 9, 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Who Do I Work For? ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">2. Description of Service</h2>
          <p>The Service provides transparency and intelligence tools that surface publicly available information about companies, including political spending, lobbying activity, executive donations, and related public-record signals. The Service is designed for informational purposes and provides educational insights only. It does not constitute legal, financial, or moral advice. We do not use your private documents to train AI models.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">3. User Accounts</h2>
          <p>You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">4. Subscriptions and Payments</h2>
          <p>Paid features are billed on a monthly recurring basis through Stripe. You may cancel your subscription at any time through the customer portal. Cancellation takes effect at the end of the current billing period. Refunds are handled on a case-by-case basis.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">5. Data and Accuracy</h2>
          <p>Information provided by the Service is derived from publicly available records including FEC filings, lobbying disclosures, government contract databases, and third-party organization summaries. While we strive for accuracy, we do not guarantee the completeness or timeliness of all data. Users should independently verify information before making decisions.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">6. Acceptable Use</h2>
          <p>You agree not to use the Service to harass, defame, or harm any individual or organization. You agree not to scrape, reverse-engineer, or redistribute data from the Service without written permission.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">7. Limitation of Liability</h2>
          <p>The Service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service or reliance on any information provided.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">8. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">9. Contact</h2>
          <p>For questions about these Terms, please use the Request Correction form or contact us through the platform.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
