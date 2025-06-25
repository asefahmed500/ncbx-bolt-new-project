
import Link from 'next/link';
import { AppHeader } from '@/components/editor/app-header';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Mail, BookOpen } from 'lucide-react';

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I start building a website?",
      answer: "After registering, go to your dashboard and click 'Create New Website'. You can choose to start from a blank canvas, use a template, or generate a site with our AI assistant."
    },
    {
      question: "Can I connect my own custom domain?",
      answer: "Yes! Custom domain support is included in our Pro and Enterprise plans. You can add your domain in your website's settings and we'll provide you with the DNS records you need to point to our servers."
    },
    {
      question: "How does the AI content generation work?",
      answer: "Our AI tools are powered by advanced language models. You can use the AI Copy generator from the editor to get suggestions for headlines, paragraphs, and other text content by providing a few keywords and a desired tone."
    },
    {
      question: "What is your refund policy?",
      answer: "We offer a 14-day money-back guarantee on all our paid plans. If you're not satisfied, please contact our support team within 14 days of your purchase for a full refund."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-primary/10">
          <div className="container mx-auto px-6 text-center">
            <HelpCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 text-primary">
              Support Center
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              We're here to help. Find answers to common questions or get in touch with our team.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="text-3xl font-headline font-semibold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-headline font-semibold text-center mb-12">Still Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <Mail className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Email Us</CardTitle>
                  <CardDescription>
                    Send us an email and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="mailto:support@ncbx.com" className="font-semibold text-primary text-lg hover:underline">
                    support@ncbx.com
                  </a>
                </CardContent>
              </Card>
              <Card className="shadow-lg">
                <CardHeader>
                  <BookOpen className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Read the Docs</CardTitle>
                  <CardDescription>
                    Dive deeper into our features and guides in our official documentation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <a href="/docs" className="font-semibold text-primary text-lg hover:underline">
                    Browse Documentation
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
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
