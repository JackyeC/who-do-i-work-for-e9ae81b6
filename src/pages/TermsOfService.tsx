import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TermsOfService = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
      <div className="prose prose-sm text-muted-foreground space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: March 12, 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Who Do I Work For? ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">2. Description of Service</h2>
          <p>The Service provides career intelligence and transparency tools that surface publicly available information about companies, including political spending, lobbying activity, executive donations, and related public-record signals. The Service is designed for informational purposes and provides educational insights only.</p>
          <p className="font-semibold text-foreground mt-3">The Service is not a law firm and does not provide legal advice. Nothing on this platform should be interpreted as legal advice or as a substitute for consulting a qualified attorney. Use of this platform does not create an attorney-client relationship.</p>
          <p>We do not use your private documents to train AI models.</p>
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
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">5. Data Sources and Accuracy</h2>
          <p>Company insights presented on this platform are derived from publicly available datasets, including government filings (FEC, SEC, OSHA, NLRB, EPA), regulatory databases, and independent research organizations. While reasonable efforts are made to present accurate and current information, the platform cannot guarantee the completeness, accuracy, or timeliness of third-party data sources.</p>
          <p>All company assessments represent algorithmic interpretations of available information. Users should independently verify information before making decisions.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">6. Automated Analysis</h2>
          <p>Offer evaluations, scores (including the Offer Strength Score™ and Career Alignment Score™), and company insights are generated through automated systems using publicly available data and document analysis. These scores represent analytical interpretations of available data and user preferences, intended to provide context and insight rather than definitive judgments.</p>
          <p>Automated analysis may contain errors, omissions, or incomplete interpretations. Users should review all employment documents carefully and consult professional advisors when appropriate.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">7. User Decision Responsibility</h2>
          <p>All career and employment decisions remain the sole responsibility of the user. The platform provides informational insights to assist in evaluating employment opportunities but does not recommend specific decisions or outcomes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">8. Document Processing</h2>
          <p>Uploaded documents are processed automatically to generate insights. Documents may be temporarily stored for analysis purposes and are handled according to our Privacy Policy. Users retain the right to delete their uploaded documents and associated data at any time.</p>
          <p>We do not use your private documents to train AI models. Users should avoid uploading documents that contain information they are not authorized to share.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">9. Acceptable Use</h2>
          <p>You agree not to use the Service to harass, defame, or harm any individual or organization. You agree not to scrape, reverse-engineer, or redistribute data from the Service without written permission.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">10. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, the platform and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from the use of the platform or reliance on any information provided, including but not limited to damages related to career decisions, employment outcomes, or contract negotiations.</p>
          <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. Use of the platform is at the user's own risk.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">11. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">12. Contact</h2>
          <p>For questions about these Terms, please use the Request Correction form or contact us through the platform.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
