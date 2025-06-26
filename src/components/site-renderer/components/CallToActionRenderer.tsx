
import type { IPageComponent } from '@/models/PageComponent';

interface CallToActionRendererProps {
  config: IPageComponent['config'];
}

const CallToActionRenderer: React.FC<CallToActionRendererProps> = ({ config }) => {
  const text = config?.text || 'Ready to take the next step?';
  const buttonText = config?.buttonText || 'Get Started';
  const buttonLink = config?.buttonLink || '/contact';
  const backgroundColor = config?.backgroundColor || 'bg-primary';
  const textColor = config?.textColor || 'text-primary-foreground';

  return (
    <section className={`py-12 md:py-16 ${backgroundColor} ${textColor}`}>
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-semibold font-headline mb-6">{text}</h2>
        {buttonText && buttonLink && (
          <a
            href={buttonLink as string}
            className={`inline-block ${ 
              backgroundColor.includes('primary') || backgroundColor.includes('accent') 
              ? 'bg-background text-foreground hover:bg-muted' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
            } px-8 py-3 rounded-md text-lg font-medium shadow-lg transition-colors`}
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

export default CallToActionRenderer;
