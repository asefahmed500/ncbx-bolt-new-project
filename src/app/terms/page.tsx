
import Link from 'next/link';
import { AppHeader } from '@/components/editor/app-header';
import { HelpCircle, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="container mx-auto px-6 py-12 md:py-20 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <FileText className="w-10 h-10 text-primary" />
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Terms of Service</h1>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <p>
            Please read these Terms of Service ("Terms") carefully before using the NCBX website builder service (the "Service") operated by NCBX ("us", "we", or "our"). Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">1. Accounts</h2>
          <p>
            When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">2. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness. You retain any and all of your rights to any Content you submit, post or display on or through the Service.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground">3. Prohibited Uses</h2>
          <p>
            You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the services of NCBX, or the general business of NCBX.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">4. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">5. Changes To Service</h2>
          <p>
            We reserve the right to withdraw or amend our Service, and any service or material we provide via the Service, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Service is unavailable at any time or for any period.
          </p>

          <h2 className="text-2xl font-semibold text-foreground">6. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:legal@ncbx.com" className="text-primary hover:underline">legal@ncbx.com</a>.
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
