
import type { IPageComponent } from '@/models/PageComponent';

interface NavbarLinkItem {
  text: string;
  href: string;
  type?: 'internal' | 'external'; // Optional type to distinguish links
}

interface NavbarRendererProps {
  config: IPageComponent['config'];
  // Navigations prop removed as direct fetching or snapshotting in editor is now the approach
}

const NavbarRenderer: React.FC<NavbarRendererProps> = ({ config }) => {
  const brandText = config?.brandText || 'MySite';
  const brandLink = config?.brandLink || '/'; // Default brand link to homepage
  
  // Renderer now directly uses config.links, which is populated by the editor
  // either manually or as a snapshot from a selected Navigation entity.
  const linksToRender: NavbarLinkItem[] = config?.links || [];
  
  const backgroundColor = config?.backgroundColor || 'bg-neutral-100'; 
  const textColor = config?.textColor || 'text-neutral-800';

  // In a real app, one might fetch navigation items if only navigationId is present,
  // but for now, we rely on the editor to populate config.links.
  // if (config?.navigationId && !linksToRender.length) {
  //   // Potentially show a loading state or a placeholder if links were meant to be fetched dynamically
  //   console.warn(`Navbar linked to navigationId "${config.navigationId}" but has no links in its config. Displaying empty.`);
  // }

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
