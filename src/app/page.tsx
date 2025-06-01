
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/editor/app-header';
import { CheckCircle, Info, Briefcase, DollarSign, Users, BarChart3, MessageSquare } from 'lucide-react';

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
          <h2 className="text-3xl md:text-4xl font-headline font-semibold text-center mb-16">
            Why Choose NCBX Canvas?
          </h2>
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
          <h2 className="text-3xl md:text-4xl font-headline font-semibold text-center mb-12">
            <Info className="w-10 h-10 inline-block mr-3 text-primary/80" />
            About NCBX Canvas
          </h2>
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
          <h2 className="text-3xl md:text-4xl font-headline font-semibold text-center mb-16">
            <Briefcase className="w-10 h-10 inline-block mr-3 text-primary/80" />
            Our Core Offerings
          </h2>
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

      {/* Pricing Section Placeholder */}
      <section id="pricing" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-semibold mb-12">
            <DollarSign className="w-10 h-10 inline-block mr-3 text-primary/80" />
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-muted/50 p-6">
                <CardTitle className="font-headline text-xl">Free Tier</CardTitle>
                <p className="text-3xl font-bold mt-2">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> 1 Website</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Basic Templates</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Community Support</p>
                <Button className="w-full mt-4" variant="outline">Get Started</Button>
              </CardContent>
            </Card>
            {/* Pro Plan */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow border-2 border-primary">
              <CardHeader className="bg-primary/10 p-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="font-headline text-xl text-primary">Pro Plan</CardTitle>
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">Popular</span>
                </div>
                <p className="text-3xl font-bold mt-2">$19<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> 5 Websites</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> All Templates & AI Tools</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Custom Domain</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Priority Support</p>
                <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">Choose Pro</Button>
              </CardContent>
            </Card>
            {/* Enterprise Plan */}
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="bg-muted/50 p-6">
                <CardTitle className="font-headline text-xl">Enterprise</CardTitle>
                 <p className="text-3xl font-bold mt-2">Custom</p>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Unlimited Websites</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Advanced Features</p>
                <p><CheckCircle className="w-4 h-4 inline mr-2 text-green-500" /> Dedicated Support</p>
                <Button className="w-full mt-4" variant="outline">Contact Us</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder Section - Kept from original */}
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

      {/* CTA Section - Kept from original */}
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
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NCBX Website Canvas. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/#about" className="hover:text-primary">About</Link>
            <Link href="/#services" className="hover:text-primary">Services</Link>
            <Link href="/#pricing" className="hover:text-primary">Pricing</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
