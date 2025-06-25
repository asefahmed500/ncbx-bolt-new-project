
"use client";

import type { IPageComponent } from '@/models/PageComponent';

interface NavbarLinkItem {
  text: string;
  href: string;
  type?: 'internal' | 'external';
}

interface NavbarRendererProps {
  config: IPageComponent['config'];
}

const NavbarRenderer: React.FC<NavbarRendererProps> = ({ config }) => {
  const brandText = config?.brandText || 'MySite';
  const brandLink = config?.brandLink || '/';
  
  const linksToRender: NavbarLinkItem[] = config?.links || [];
  
  const backgroundColor = config?.backgroundColor || 'bg-neutral-100'; 
  const textColor = config?.textColor || 'text-neutral-800';

  return (
    <nav className={`p-4 shadow-md ${backgroundColor} ${textColor}`}>
      <div className="container mx-auto flex justify-between items-center">
        <a href={brandLink} className="text-xl font-bold font-headline">
          {brandText}
        </a>
        <div className="space-x-4">
          {linksToRender.map((link, index) => (
            <a 
              key={index} 
              href={link.href} 
              className="hover:text-primary transition-colors"
              target={link.type === 'external' ? '_blank' : undefined}
              rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
            >
              {link.text}
            </a>
          ))}
          {linksToRender.length === 0 && (
            <span className="text-xs text-muted-foreground italic">(No navigation links configured)</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarRenderer;

    