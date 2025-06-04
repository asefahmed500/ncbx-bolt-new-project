import type { IPageComponent } from '@/models/PageComponent';

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  features: string[];
  buttonText?: string;
  buttonLink?: string;
  isPopular?: boolean;
}

interface PricingTableRendererProps {
  config: IPageComponent['config'];
}

const PricingTableRenderer: React.FC<PricingTableRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Our Pricing Plans';
  const plans: PricingPlan[] = config?.plans || [
    { name: "Basic", price: "$19", period: "/mo", features: ["Feature 1", "Feature 2", "Limited Support"], buttonText: "Choose Basic", buttonLink: "#" },
    { name: "Pro", price: "$49", period: "/mo", features: ["All Basic Features", "Feature 3", "Feature 4", "Priority Support"], buttonText: "Choose Pro", buttonLink: "#", isPopular: true },
    { name: "Enterprise", price: "Custom", features: ["All Pro Features", "Dedicated Support", "Custom Integrations"], buttonText: "Contact Us", buttonLink: "#" },
  ];
  const highlightColor = config?.highlightColor || 'border-primary';

  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div key={index} className={`bg-card rounded-lg shadow-xl border ${plan.isPopular ? highlightColor + ' border-2' : 'border-border'} p-6 flex flex-col`}>
              {plan.isPopular && (
                <div className="text-right mb-2 -mt-2 -mr-2">
                  <span className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-md font-semibold">Popular</span>
                </div>
              )}
              <h3 className="text-2xl font-semibold font-headline mb-2 text-card-foreground">{plan.name}</h3>
              <p className="text-4xl font-bold mb-1 text-primary">{plan.price}<span className="text-base font-normal text-muted-foreground">{plan.period}</span></p>
              <ul className="space-y-2 text-sm text-muted-foreground mt-4 mb-6 flex-grow">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.buttonLink || '#'}
                className={`block w-full text-center py-3 px-6 rounded-md font-medium transition-colors shadow-md ${
                  plan.isPopular 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {plan.buttonText || 'Get Started'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingTableRenderer;
