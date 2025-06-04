import type { IPageComponent } from '@/models/PageComponent';
// For icons, you'd typically map string names to actual Lucide icon components

interface StatItem {
  value: string;
  label: string;
  icon?: string; // Name of a Lucide icon
}

interface StatsRendererProps {
  config: IPageComponent['config'];
}

const StatsRenderer: React.FC<StatsRendererProps> = ({ config }) => {
  const sectionTitle = config?.title;
  const items: StatItem[] = config?.items || [
    { value: "1.2K+", label: "Projects Completed", icon: "Briefcase" },
    { value: "98%", label: "Client Satisfaction", icon: "Smile" },
    { value: "50+", label: "Expert Team Members", icon: "Users" },
    { value: "10Y+", label: "Years of Experience", icon: "Award" },
  ];
  const itemTextColor = config?.itemTextColor || 'text-primary';
  const labelTextColor = config?.labelTextColor || 'text-muted-foreground';
  const iconColor = config?.iconColor || 'text-primary/70';

  return (
    <section className="py-12 md:py-20 bg-muted/30 text-foreground">
      <div className="container mx-auto px-6">
        {sectionTitle && <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {items.map((item, index) => (
            <div key={index} className="bg-card p-6 rounded-lg shadow-lg border border-border">
              {item.icon && (
                <div className={`mb-3 text-4xl ${iconColor} mx-auto w-fit`}>
                  {/* In a real app, use dynamic icon component here */}
                  <span>{item.icon.slice(0,1)}</span>
                </div>
              )}
              <p className={`text-4xl font-bold ${itemTextColor} mb-1`}>{item.value}</p>
              <p className={`text-sm ${labelTextColor} uppercase tracking-wider`}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsRenderer;
