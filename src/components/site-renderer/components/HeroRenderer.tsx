
import type { IPageComponent } from '@/models/PageComponent';
// No NextImage needed if only background image for now

interface HeroRendererProps {
  config: IPageComponent['config'];
}

const HeroRenderer: React.FC<HeroRendererProps> = ({ config }) => {
  const title = config?.title || 'Hero Title';
  const subtitle = config?.subtitle || 'Amazing subtitle describing the hero section.';
  const buttonText = config?.buttonText;
  const buttonLink = config?.buttonLink;
  const backgroundImage = config?.backgroundImage;
  const backgroundColor = config?.backgroundColor || 'bg-primary/10';
  const textColor = config?.textColor || 'text-neutral-800'; // Default to dark text if background is light
  const textAlign = config?.textAlign || 'text-center'; // text-left, text-center, text-right

  // Revert to placeholder if the image URL is cleared.
  const finalBackgroundImage = backgroundImage === "" ? "https://placehold.co/1200x600.png" : backgroundImage;

  const sectionStyle: React.CSSProperties = finalBackgroundImage ? {
    backgroundImage: `url('${finalBackgroundImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <section className={`py-20 md:py-32 ${!finalBackgroundImage ? backgroundColor : ''} ${textColor} relative`} style={sectionStyle}>
      {finalBackgroundImage && <div className="absolute inset-0 bg-black/30 z-0"></div>}
      <div className={`container mx-auto px-6 ${textAlign} relative z-10`}>
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-6">{title}</h1>
        {subtitle && <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">{subtitle}</p>}
        {buttonText && buttonLink && (
          <a
            href={buttonLink as string}
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md text-lg font-medium shadow-lg transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
    </section>
  );
};

export default HeroRenderer;
