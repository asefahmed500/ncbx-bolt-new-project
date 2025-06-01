
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/editor/app-header'; // Generic header for landing
import { CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader /> {/* Using a generic AppHeader configuration */}

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-6 text-primary">
            Build Stunning Websites, Effortlessly.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            NCBX Website Canvas empowers you to create professional, responsive websites with an intuitive drag-and-drop editor. No code required.
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-headline font-semibold text-center mb-16">
            Why Choose NCBX Canvas?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Drag & Drop Editor', description: 'Visually design your website with our intuitive interface.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'AI-Powered Copy', description: 'Generate compelling website content with integrated AI tools.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
              { title: 'Responsive by Design', description: 'Websites look great on all devices, from desktops to mobiles.', icon: <CheckCircle className="w-8 h-8 text-primary" /> },
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

      {/* Testimonials Placeholder Section */}
      <section className="py-16 md:py-24 bg-background">
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
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NCBX Website Canvas. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
