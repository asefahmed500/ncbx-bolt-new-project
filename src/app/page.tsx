
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/editor/app-header';
import { CheckCircle, Info, Briefcase, DollarSign, Users, BarChart3, MessageSquare, Zap, HelpCircle } from 'lucide-react';
import { PricingSection } from '@/components/landing/pricing-section'; 

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 text-primary">
            Build Stunning Websites, Effortlessly.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            NCBX Website Canvas empowers you to create professional, responsive websites with an intuitive drag-and-drop editor. No code required. Launch your vision today!
          </p>
          <div className="space-x-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Link href="/register">Get Started for Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg">
              <Link href="/editor">Try the Editor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-headline font-semibold">
              Why Choose NCBX Canvas?
            </h2>
            <p className="text-lg text-muted-foreground mt-3 max-w-xl mx-auto">Powerful features designed to bring your vision to life quickly and efficiently.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Drag & Drop Editor', description: 'Visually design your website with our intuitive interface.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'AI-Powered Copy', description: 'Generate compelling website content with integrated AI tools.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'Responsive by Design', description: 'Websites look great on all devices, from desktops to mobiles.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'Customizable Templates', description: 'Start with professionally designed templates or build from scratch.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'SEO Friendly', description: 'Built-in tools to help your website rank higher in search engines.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'Fast Performance', description: 'Optimized for speed to provide the best user experience.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
            ].map((feature, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow bg-card">
                <CardHeader className="items-center text-center">
                  {feature.icon}
                  <CardTitle className="mt-4 text-xl font-headline">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section Placeholder */}
      <section id="about" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <Info className="w-12 h-12 text-primary/80 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-headline font-semibold">
              About NCBX Canvas
            </h2>
          </div>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg text-muted-foreground mb-4">
              We believe creating a powerful online presence shouldn't be complicated. NCBX Canvas was born from the desire to empower creators, entrepreneurs, and businesses of all sizes to build beautiful, high-performing websites without needing to write a single line of code.
            </p>
            <p className="text-lg text-muted-foreground">
              Our mission is to provide an intuitive, flexible, and powerful platform that grows with you. Join our community and bring your digital vision to life!
            </p>
            <Image src="https://placehold.co/600x400.png" alt="Team working on NCBX Canvas" width={600} height={400} className="mt-10 rounded-lg shadow-xl mx-auto" data-ai-hint="team collaboration" />
          </div>
        </div>
      </section>

      {/* Services Section Placeholder */}
      <section id="services" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Briefcase className="w-12 h-12 text-primary/80 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-headline font-semibold">
              Our Core Offerings
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle className="font-headline text-center">For Individuals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Personal portfolios, blogs, and creative showcases. Easy to start, powerful enough to impress.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle className="font-headline text-center">For Businesses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Corporate sites, landing pages, and e-commerce solutions. Drive growth with a professional online presence.</p>
              </CardContent>
            </Card>
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle className="font-headline text-center">AI Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">Leverage AI for copy generation, image suggestions, and more to build smarter, faster.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      
      <PricingSection />

      {/* Testimonials Placeholder Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-semibold mb-12">
            Loved by Creators
          </h2>
          <div className="max-w-3xl mx-auto">
            <Card className="p-8 shadow-lg bg-card">
              <p className="text-lg text-muted-foreground italic mb-6">
                "NCBX Canvas transformed how I build websites for my clients. It's fast, intuitive, and the AI features are a game-changer!"
              </p>
              <p className="font-semibold font-headline">- Alex P, Web Designer</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-primary/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-semibold mb-8">
            Ready to Build Your Dream Website?
          </h2>
          <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl px-10 py-6 text-lg">
            <Link href="/register">Sign Up Now</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="support" className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NCBX Website Canvas. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/#about" className="hover:text-primary">About</Link>
            <Link href="/#services" className="hover:text-primary">Services</Link>
            <Link href="/#pricing" className="hover:text-primary">Pricing</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
            <Link href="/support" className="hover:text-primary flex items-center justify-center sm:inline-flex">
              <HelpCircle className="w-4 h-4 mr-1 sm:hidden" /> Support
            </Link>
          </div>
        </div>
      </footer>

      {/* Built on Bolt Badge */}
      <a 
        href="https://bolt.new" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 bg-card text-foreground text-xs font-semibold px-4 py-2 rounded-lg shadow-lg z-50 border border-border hover:shadow-xl transition-shadow hover:bg-muted flex items-center gap-2"
        title="This project was built using Bolt.new"
      >
        {/* Placeholder for Bolt SVG/Image - using text for now */}
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 2-7 10 7 10 7-10-7-10z"></path><path d="m12 22 7-10-7-10-7 10 7 10z"></path></svg>
        Built on Bolt.new
      </a>
    </div>
  );
}
