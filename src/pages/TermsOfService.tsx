import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePageSEO } from "@/hooks/use-page-seo";

const TermsOfService = () => {
  usePageSEO({
    title: "Terms of Service",
    description: "Terms of Service for Who Do I Work For? career intelligence platform. Usage terms, disclaimers, and acceptable use policies.",
    path: "/terms",
  });

  return (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>
      <div className="prose prose-sm text-muted-foreground space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: March 31, 2026</p>

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

        {/* ── NEW: Career Agent Authorization ── */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">9. Career Agent Authorization ("Fairness Contract")</h2>
          <p>When you enable the Auto-Apply feature, you appoint Who Do I Work For? as your authorized Career Agent. This grants us permission to:</p>
          <ul className="list-disc pl-6 space-y-1.5 mt-2">
            <li><strong className="text-foreground">Identify:</strong> Scan publicly available job postings and market data to find roles that match your values profile and career preferences.</li>
            <li><strong className="text-foreground">Draft:</strong> Use our AI systems to tailor your experience and qualifications to specific job descriptions, highlighting only information you have provided.</li>
            <li><strong className="text-foreground">Submit:</strong> File applications on your behalf to employer platforms, but only after you have reviewed and explicitly approved each application.</li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">9a. No-Hallucination Promise</h3>
          <p>Our AI systems will never fabricate, invent, or embellish skills, job titles, employment dates, educational credentials, or any other factual information in your applications. We only highlight and reformat information you have directly provided. If you identify any inaccuracy in a generated application draft, you must flag it before approving submission.</p>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">9b. Human-in-the-Loop Requirement</h3>
          <p>No application will be submitted to any employer without your explicit, affirmative approval. You retain final authority over every submission. The platform will present each application draft for your review before processing.</p>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">9c. Transparency Tag</h3>
          <p>Every application submitted through the Service will include a disclosure statement indicating that the application was curated with AI assistance and personally reviewed and authorized by you, the candidate. This protects your reputation and ensures compliance with employer AI disclosure expectations.</p>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">9d. Audit Trail</h3>
          <p>You may view a complete log of every application submitted through your account, including the exact content that was sent, the employer and role targeted, and the timestamp of submission. This audit trail is available in your dashboard at any time.</p>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">9e. Biometric and Device Authentication</h3>
          <p>If you use biometric authentication (such as FaceID or fingerprint) to confirm application submissions from a mobile device, you explicitly consent to the use of that biometric trigger solely for application authorization purposes. Biometric data is processed on your device and is not stored or transmitted by our servers.</p>

          <h3 className="text-base font-semibold text-foreground mt-5 mb-2">9f. Revocation</h3>
          <p>You may revoke this Career Agent authorization at any time by disabling Auto-Apply in your settings. Upon revocation, all pending application drafts will be discarded and no further applications will be submitted on your behalf.</p>
        </section>

        {/* ── NEW: AI Transparency & Compliance ── */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">10. AI Transparency and Compliance</h2>
          <p>The Service uses artificial intelligence to analyze company data, generate application materials, and match users to employment opportunities. We are committed to transparency in how these systems operate.</p>
          <ul className="list-disc pl-6 space-y-1.5 mt-2">
            <li>All AI-generated content is clearly labeled as such throughout the platform.</li>
            <li>The Service complies with applicable AI disclosure and transparency requirements, including but not limited to the Texas Responsible AI Governance Act (TRAIGA), the Colorado AI Act, New York City Local Law 144, the Illinois AI Video Interview Act, and the EU Artificial Intelligence Act where applicable.</li>
            <li>Automated decision-making on this platform is advisory only. No employment decisions are made by our AI systems.</li>
            <li>Users may request an explanation of how any AI-generated score, match, or recommendation was produced.</li>
          </ul>
        </section>

        {/* ── NEW: Global Data Processing ── */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">11. Global Data Processing</h2>
          <p>The Service may match users with employment opportunities in multiple countries and jurisdictions. By using the Service, you acknowledge and consent to the following:</p>
          <ul className="list-disc pl-6 space-y-1.5 mt-2">
            <li>Your profile data, resume content, and career preferences may be processed for roles located in jurisdictions outside your country of residence.</li>
            <li>Company intelligence data is sourced from public records across multiple countries and regulatory frameworks.</li>
            <li>Cross-border data transfers are conducted in accordance with applicable data protection laws, including GDPR where applicable.</li>
            <li>You may restrict the geographic scope of your job matching preferences at any time in your account settings.</li>
          </ul>
        </section>

        {/* ── NEW: Bias Audit Commitment ── */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">12. Bias Audit Commitment</h2>
          <p>We are committed to ensuring that our AI-powered matching and recommendation algorithms do not produce discriminatory outcomes. To uphold this commitment:</p>
          <ul className="list-disc pl-6 space-y-1.5 mt-2">
            <li>We conduct annual internal reviews of our matching algorithms to identify and mitigate potential bias across protected characteristics including race, gender, age, disability, and national origin.</li>
            <li>We engage qualified third-party auditors to conduct independent bias assessments of our automated employment decision tools, as required by applicable law.</li>
            <li>Audit summaries are made available to users upon request.</li>
            <li>Users who believe they have experienced discriminatory treatment by our systems may report concerns through the platform's feedback mechanism.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">13. Acceptable Use</h2>
          <p>You agree not to use the Service to harass, defame, or harm any individual or organization. You agree not to scrape, reverse-engineer, or redistribute data from the Service without written permission.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">14. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, the platform and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from the use of the platform or reliance on any information provided, including but not limited to damages related to career decisions, employment outcomes, or contract negotiations.</p>
          <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. Use of the platform is at the user's own risk.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">15. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">16. Contact</h2>
          <p>For questions about these Terms, please use the Request Correction form or contact us through the platform.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default TermsOfService;
