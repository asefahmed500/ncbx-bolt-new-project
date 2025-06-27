
import type { IPageComponent } from '@/models/PageComponent';
import { createElement } from 'react';
import * as Icons from 'lucide-react';

interface ServiceItem {
  name: string;
  description: string;
  icon?: string; // Name of a Lucide icon, e.g., "Layout"
  link?: string;
}

interface ServicesListRendererProps {
  config: IPageComponent['config'];
}

const ServicesListRenderer: React.FC<ServicesListRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Our Services';
  const items: ServiceItem[] = config?.items || [
    { name: "Web Design", description: "Crafting beautiful and intuitive user experiences for the web.", icon: "Layout", link: "#service-design" },
    { name: "Development", description: "Building robust and scalable web applications with modern technologies.", icon: "Code", link: "#service-dev" },
    { name: "SEO Optimization", description: "Helping your website rank higher in search engine results.", icon: "TrendingUp", link: "#service-seo" },
  ];
  const layout = config?.layout || 'grid'; // 'grid' or 'list'
  const iconColor = config?.iconColor || 'text-accent';

  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className={`gap-8 ${layout === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3' : 'space-y-8'}`}>
          {items.map((item, index) => {
             const IconComponent = item.icon && (Icons as any)[item.icon]
                ? createElement((Icons as any)[item.icon], { className: `h-8 w-8 ${iconColor}` })
                : null;
            return (
              <div key={index} className="bg-card p-8 rounded-xl shadow-lg border border-border hover:shadow-2xl transition-shadow">
                {IconComponent && (
                  <div className={`mb-4 inline-block p-3 rounded-full bg-accent/10`}>
                    {IconComponent}
                  </div>
                )}
                <h3 className="text-xl font-semibold font-headline mb-3 text-card-foreground">{item.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                {item.link && (
                  <a href={item.link} className="text-primary hover:underline font-medium text-sm">
                    Learn More &rarr;
                  </a>
                )}
              </div>
            );
            })}
        </div>
      </div>
    </section>
  );
};

export default ServicesListRenderer;
