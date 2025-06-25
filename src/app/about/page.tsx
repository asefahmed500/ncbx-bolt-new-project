
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppHeader } from '@/components/editor/app-header';
import { HelpCircle, Target, Eye, Users, Handshake } from 'lucide-react';

export default function AboutPage() {
  const teamMembers = [
    { name: "Alex Johnson", role: "Founder & CEO", image: "https://placehold.co/200x200.png", dataAiHint:"ceo business person" },
    { name: "Maria Garcia", role: "Lead Developer", image: "https://placehold.co/200x200.png", dataAiHint:"engineer tech" },
    { name: "Chen Wei", role: "UX/UI Designer", image: "https://placehold.co/200x200.png", dataAiHint:"designer creative" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-primary/10">
          <div className="container mx-auto px-6 text-center">
            <Target className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 text-primary">
              Our Mission
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              To democratize web design and empower every creator, entrepreneur, and business to build a stunning, professional online presence without writing a single line of code.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-headline font-semibold mb-4">The NCBX Story</h2>
              <p className="text-muted-foreground mb-4">
                NCBX was born from a simple observation: creating a beautiful, high-performing website was too complicated and expensive for too many people. We saw brilliant individuals and businesses with incredible ideas struggle to translate their vision into a digital reality.
              </p>
              <p className="text-muted-foreground">
                We set out to change that. By combining an intuitive drag-and-drop interface with the power of artificial intelligence, we've built a platform that makes web design accessible, fast, and enjoyable for everyone, regardless of technical skill.
              </p>
            </div>
            <div>
              <Image 
                src="https://placehold.co/600x400.png" 
                alt="Team working on NCBX"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
                data-ai-hint="team collaboration"
              />
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-headline font-semibold text-center mb-12">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Empowerment', description: 'We provide the tools and support for our users to succeed on their own terms.', icon: <Users className="w-8 h-8 text-accent" /> },
                { title: 'Simplicity', description: 'We believe powerful tools can and should be easy to use. We focus on intuitive design and clear functionality.', icon: <Handshake className="w-8 h-8 text-accent" /> },
                { title: 'Innovation', description: 'We are constantly exploring new technologies, like AI, to push the boundaries of what’s possible in no-code web design.', icon: <Eye className="w-8 h-8 text-accent" /> },
              ].map((value, index) => (
                <Card key={index} className="text-center shadow-lg bg-card">
                  <CardHeader className="items-center">
                    {value.icon}
                    <CardTitle className="mt-4 text-xl font-headline">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-headline font-semibold mb-12">Meet the Team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {teamMembers.map((member) => (
                <div key={member.name}>
                  <Image 
                    src={member.image} 
                    alt={member.name}
                    width={200}
                    height={200}
                    className="rounded-full w-40 h-40 object-cover mx-auto mb-4 shadow-md"
                    data-ai-hint={member.dataAiHint}
                  />
                  <h3 className="text-xl font-headline font-medium">{member.name}</h3>
                  <p className="text-primary">{member.role}</p>
                </div>
              ))}
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
