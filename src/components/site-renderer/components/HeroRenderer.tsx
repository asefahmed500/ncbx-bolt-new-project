
import type { IPageComponent } from '@/models/PageComponent';
import NextImage from 'next/image';

interface HeroRendererProps {
  config: IPageComponent['config'];
}

const HeroRenderer: React.FC<HeroRendererProps> = ({ config }) => {
  const title = config?.title || 'Hero Title';
  const subtitle = config?.subtitle || 'Amazing subtitle describing the hero section.';
  const buttonText = config?.buttonText;
  const buttonLink = config?.buttonLink;
  const backgroundImage = config?.backgroundImage;
  const dataAiHint = config?.dataAiHint;
  const backgroundColor = config?.backgroundColor || 'bg-primary/10'; // Tailwind class
  const textColor = config?.textColor || 'text-neutral-800'; // Tailwind class
  const textAlign = config?.textAlign || 'text-center'; // text-left, text-center, text-right

  const sectionStyle: React.CSSProperties = backgroundImage ? {
    backgroundImage: `url('${backgroundImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <section className={`py-20 md:py-32 ${backgroundColor} ${textColor} relative`} style={sectionStyle}>
      {backgroundImage && <div className="absolute inset-0 bg-black/30 z-0"></div>} {/* Optional overlay for better text readability */}
      <div className={`container mx-auto px-6 ${textAlign} relative z-10`}>
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-6">{title}</h1>
        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">{subtitle}</p>
        {buttonText && buttonLink && (
          <a
            href={buttonLink}
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md text-lg font-medium shadow-lg transition-colors"
          >
            {buttonText}
          </a>
        )}
      </div>
      {/* This is just for data-ai-hint if no explicit image element is part of hero,
          but background images generally don't get alt text.
          If a foreground image IS part of the hero config, it should be its own image component. */}
      {dataAiHint && !backgroundImage && (
         <div style={{display: 'none'}} data-ai-hint={dataAiHint}></div>
      )}
    </section>
  );
};

export default HeroRenderer;
