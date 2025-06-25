
import Link from 'next/link';
import { AppHeader } from '@/components/editor/app-header';
import { HelpCircle, FileText } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-6 py-12 md:py-20 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <FileText className="w-10 h-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Privacy Policy</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            Welcome to NCBX ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website builder service (the "Service").
          </p>

          <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            We may collect personal information that you provide to us directly, such as your name, email address, and payment information when you register for an account or subscribe to a plan. We also collect content you create or upload to your websites, such as text, images, and other data.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide, operate, and maintain our Service.</li>
            <li>Process your transactions and manage your account.</li>
            <li>Improve, personalize, and expand our Service.</li>
            <li>Communicate with you, including for customer service and support.</li>
            <li>Send you technical notices, updates, security alerts, and administrative messages.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-foreground">3. Sharing Your Information</h2>
          <p>
            We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
          <p>
            We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">5. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">6. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@ncbx.com" className="text-primary hover:underline">privacy@ncbx.com</a>.
          </p>
        </div>
      </main>

      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NCBX. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/about" className="hover:text-primary">About</Link>
            <Link href="/services" className="hover:text-primary">Services</Link>
            <Link href="/pricing" className="hover:text-primary">Pricing</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link href="/support" className="hover:text-primary flex items-center justify-center sm:inline-flex">
              <HelpCircle className="w-4 h-4 mr-1 sm:hidden" /> Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
