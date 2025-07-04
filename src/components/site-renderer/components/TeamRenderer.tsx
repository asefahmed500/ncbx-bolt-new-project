
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image';
import { Twitter, Linkedin, Github } from 'lucide-react';
import { createElement } from 'react';

interface SocialLink {
    platform: 'twitter' | 'linkedin' | 'github' | string;
    url: string;
}

interface TeamMember {
  name: string;
  role: string;
  image?: string;
  bio?: string;
  socialLinks?: SocialLink[];
  dataAiHint?: string;
}

interface TeamRendererProps {
  config: IPageComponent['config'];
}

const socialIconMap = {
    twitter: Twitter,
    linkedin: Linkedin,
    github: Github,
};


const TeamRenderer: React.FC<TeamRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Meet Our Team';
  const members: TeamMember[] = config?.members || [
    { name: "Alice Johnson", role: "Chief Executive Officer", image: "https://placehold.co/300x300.png", bio: "Alice leads with vision and passion.", dataAiHint:"ceo business person", socialLinks: [{platform: 'linkedin', url: '#'}]},
    { name: "Bob Williams", role: "Head of Technology", image: "https://placehold.co/300x300.png", bio: "Bob is our tech guru, driving innovation.", dataAiHint:"engineer tech", socialLinks: [{platform: 'github', url: '#'}]},
    { name: "Carol Davis", role: "Marketing Director", image: "https://placehold.co/300x300.png", bio: "Carol crafts compelling brand stories.", dataAiHint:"marketing professional", socialLinks: [{platform: 'twitter', url: '#'}]},
  ];

  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {members.map((member, index) => (
            <div key={index} className="bg-card rounded-xl shadow-lg overflow-hidden text-center p-6 border border-border hover:shadow-2xl transition-shadow">
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-full overflow-hidden border-2 border-primary">
                <Image
                  src={member.image || "https://placehold.co/300x300.png"}
                  alt={member.name}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={member.dataAiHint || "team member person"}
                />
              </div>
              <h3 className="text-xl font-semibold font-headline mb-1 text-card-foreground">{member.name}</h3>
              <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
              {member.bio && <p className="text-xs text-muted-foreground mb-4">{member.bio}</p>}
              {member.socialLinks && member.socialLinks.length > 0 && (
                <div className="flex justify-center space-x-4">
                  {member.socialLinks.map((social, sIndex) => {
                    const IconComponent = (socialIconMap as any)[social.platform];
                    return (
                        <a key={sIndex} href={social.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            {IconComponent ? createElement(IconComponent, { className: 'h-5 w-5' }) : social.platform.charAt(0).toUpperCase()}
                            <span className="sr-only">{social.platform}</span>
                        </a>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamRenderer;
