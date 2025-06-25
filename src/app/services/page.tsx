
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/editor/app-header';
import { HelpCircle, Zap, LayoutGrid, Globe, Wand2, ShieldCheck, AreaChart } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      icon: <LayoutGrid className="w-10 h-10 text-primary" />,
      title: 'Intuitive Website Builder',
      description: 'Our core offering. A powerful, drag-and-drop editor that lets you build responsive websites visually. No coding required, ever.',
    },
    {
      icon: <Wand2 className="w-10 h-10 text-primary" />,
      title: 'AI Content Generation',
      description: 'Stuck on what to write? Use our integrated AI to generate compelling headlines, paragraphs, and product descriptions in seconds.',
    },
    {
      icon: <Globe className="w-10 h-10 text-primary" />,
      title: 'Hosting & Custom Domains',
      description: 'Every plan comes with reliable hosting. Upgrade to our Pro plan to connect your own custom domain for a professional brand identity.',
    },
    {
      icon: <Zap className="w-10 h-10 text-primary" />,
      title: 'Professionally Designed Templates',
      description: 'Kickstart your project with our library of fully customizable templates, built for various industries and use-cases.',
    },
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: 'Security & Maintenance',
      description: 'We handle the technical stuff like security updates, SSL certificates, and server maintenance, so you can focus on your content.',
    },
    {
      icon: <AreaChart className="w-10 h-10 text-primary" />,
      title: 'Analytics & SEO Tools',
      description: 'Understand your audience and improve your search engine ranking with our built-in SEO and analytics tools (Pro Plan feature).',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-primary/10">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 text-primary">
              Our Services
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to build, launch, and grow your online presence. We provide the tools, you provide the vision.
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow bg-card flex flex-col">
                  <CardHeader>
                    {service.icon}
                    <CardTitle className="mt-4 text-xl font-headline">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-headline font-semibold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Explore our plans and find the perfect fit for your project. All plans start with a free trial of our premium features.
            </p>
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/pricing">View Pricing & Plans</Link>
            </Button>
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
