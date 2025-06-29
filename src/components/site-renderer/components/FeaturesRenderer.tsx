
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import { createElement } from 'react';
import * as Icons from 'lucide-react';

interface FeatureItem {
  title: string;
  description: string;
  icon?: string; // Name of a Lucide icon, e.g., "Zap"
}

interface FeaturesRendererProps {
  config: IPageComponent['config'];
}

const FeaturesRenderer: React.FC<FeaturesRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Our Key Features';
  const items: FeatureItem[] = config?.items || [
    { title: "Fast Performance", description: "Optimized for speed and reliability.", icon: "Zap" },
    { title: "Secure Platform", description: "Your data is safe with us.", icon: "ShieldCheck" },
    { title: "User Friendly", description: "Easy to use and intuitive interface.", icon: "ThumbsUp" },
  ];
  const layout = config?.layout || 'grid'; // 'grid' or 'list'
  const iconColor = config?.iconColor || 'text-primary';

  return (
    <section className="py-12 md:py-20 bg-muted/30 text-foreground">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className={`gap-8 ${layout === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3' : 'space-y-8'}`}>
          {items.map((item, index) => {
            const IconComponent = item.icon && (Icons as any)[item.icon] ? createElement((Icons as any)[item.icon], {className: 'h-8 w-8'}) : null;
            return (
              <div key={index} className="bg-card p-6 rounded-lg shadow-lg border border-border text-center md:text-left flex flex-col md:flex-row items-center md:items-start gap-4">
                {IconComponent && (
                  <div className={`p-3 rounded-full bg-primary/10 ${iconColor} mb-4 md:mb-0`}>
                    {IconComponent}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold font-headline mb-2 text-card-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesRenderer;
