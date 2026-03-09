import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
      <div className="prose prose-sm text-muted-foreground space-y-6">
        <p className="text-sm text-muted-foreground">Last updated: March 9, 2026</p>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">1. Information We Collect</h2>
          <p><strong>Account Information:</strong> When you sign up, we collect your email address and name through Google OAuth. We do not store passwords.</p>
          <p><strong>Usage Data:</strong> We collect information about how you use the Service, including pages visited, searches performed, and features used.</p>
          <p><strong>Uploaded Documents:</strong> If you use the Offer Review feature, uploaded documents are processed securely and can be deleted at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">2. How We Use Your Information</h2>
          <p>We use your information to provide and improve the Service, process payments, send alerts you've subscribed to, and communicate important updates.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">3. Data Sharing</h2>
          <p>We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Stripe for payment processing</li>
            <li>Service providers necessary to operate the platform</li>
            <li>Law enforcement when required by law</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">4. Data Security</h2>
          <p>We use industry-standard security measures including encryption in transit and at rest, row-level security policies, and secure authentication through OAuth providers.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">5. Data Retention</h2>
          <p>Account data is retained as long as your account is active. Uploaded documents can be deleted at any time. Career contacts and saved reports are retained until you delete them or your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">6. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. You can delete uploaded documents, career contacts, and saved reports through the platform. To delete your account entirely, contact us through the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">7. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use third-party tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes through the platform or by email.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">9. Contact</h2>
          <p>For privacy-related questions or requests, please use the Request Correction form or contact us through the platform.</p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
