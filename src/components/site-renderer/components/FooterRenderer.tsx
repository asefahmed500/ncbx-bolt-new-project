
import type { IPageComponent } from '@/models/PageComponent';

interface FooterLink {
  text: string;
  href: string;
}

interface FooterRendererProps {
  config: IPageComponent['config'];
}

const FooterRenderer: React.FC<FooterRendererProps> = ({ config }) => {
  const copyrightText = config?.copyrightText || `© ${new Date().getFullYear()} Your Company. All rights reserved.`;
  const links: FooterLink[] = config?.links || [{ text: "Privacy Policy", href: "/privacy" }, { text: "Terms of Service", href: "/terms" }];
  const backgroundColor = config?.backgroundColor || 'bg-neutral-800'; // Tailwind class
  const textColor = config?.textColor || 'text-neutral-300'; // Tailwind class

  return (
    <footer className={`py-8 ${backgroundColor} ${textColor}`}>
      <div className="container mx-auto px-6 text-center">
        <p className="text-sm">{copyrightText}</p>
        {links && links.length > 0 && (
          <div className="mt-4 space-x-4">
            {links.map((link, index) => (
              <a key={index} href={link.href} className="text-sm hover:text-primary transition-colors">
                {link.text}
              </a>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
};

export default FooterRenderer;
