
import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image';

interface AboutSectionRendererProps {
  config: IPageComponent['config'];
}

const AboutSectionRenderer: React.FC<AboutSectionRendererProps> = ({ config }) => {
  const title = config?.title || 'About Us';
  const content = config?.content || '<p>Placeholder about section content. Update in editor.</p>';
  const imageUrl = config?.imageUrl;
  const imageAlt = config?.imageAlt || title;

  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold font-headline">{title}</h2>
        </div>
        <div className={`grid gap-12 ${imageUrl ? 'md:grid-cols-2 items-center' : 'grid-cols-1'}`}>
          {imageUrl && (
            <div className="text-center md:text-left">
              <Image 
                src={imageUrl as string || "https://placehold.co/500x350.png?text=About+Image"} 
                alt={imageAlt as string} 
                width={500}
                height={350}
                className="rounded-lg shadow-xl mx-auto md:mx-0 max-w-full h-auto"
                data-ai-hint={config?.dataAiHint as string || "company team"}
              />
            </div>
          )}
          <div className={imageUrl ? '' : 'max-w-3xl mx-auto text-center md:text-left'}>
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content as string }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionRenderer;
