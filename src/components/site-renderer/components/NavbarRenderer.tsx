import type { IPageComponent } from '@/models/PageComponent';

interface NavbarLink {
  text: string;
  href: string;
}

interface NavbarRendererProps {
  config: IPageComponent['config'];
}

const NavbarRenderer: React.FC<NavbarRendererProps> = ({ config }) => {
  const brandText = config?.brandText || 'MySite';
  const links: NavbarLink[] = config?.links || [{ text: "Home", href: "/" }];
  const backgroundColor = config?.backgroundColor || 'bg-neutral-100'; 
  const textColor = config?.textColor || 'text-neutral-800';

  return (
    <nav className={`p-4 shadow-md ${backgroundColor} ${textColor}`}>
      <div className="container mx-auto flex justify-between items-center">
        <a href={links.find(l => l.text.toLowerCase() === 'home')?.href || "/"} className="text-xl font-bold font-headline">{brandText}</a>
        <div className="space-x-4">
          {links.map((link, index) => (
            <a key={index} href={link.href} className="hover:text-primary transition-colors">
              {link.text}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavbarRenderer;