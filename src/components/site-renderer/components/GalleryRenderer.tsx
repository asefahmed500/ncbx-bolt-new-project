import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  dataAiHint?: string;
}

interface GalleryRendererProps {
  config: IPageComponent['config'];
}

const GalleryRenderer: React.FC<GalleryRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Image Gallery';
  const images: GalleryImage[] = config?.images || [
    { src: "https://placehold.co/600x400.png?text=Gallery+Image+1", alt: "Gallery Image 1", caption: "Caption for image 1", dataAiHint:"nature scene"},
    { src: "https://placehold.co/600x400.png?text=Gallery+Image+2", alt: "Gallery Image 2", dataAiHint:"architecture"},
    { src: "https://placehold.co/600x400.png?text=Gallery+Image+3", alt: "Gallery Image 3", caption: "Another beautiful view", dataAiHint:"abstract art"},
    { src: "https://placehold.co/600x400.png?text=Gallery+Image+4", alt: "Gallery Image 4", dataAiHint:"portrait"},
  ];
  const columns = config?.columns || 3; // e.g., 2, 3, 4 columns
  const enableLightbox = config?.enableLightbox !== undefined ? config.enableLightbox : true; // conceptual

  // Basic grid styling, lightbox would require a library or more complex JS
  const gridClasses = 
    columns === 4 ? 'grid-cols-2 md:grid-cols-4' :
    columns === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' :
    columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
    'grid-cols-1';


  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6">
        {sectionTitle && <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>}
        <div className={`grid ${gridClasses} gap-4 md:gap-6`}>
          {images.map((image, index) => (
            <figure key={index} className="group relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow aspect-w-1 aspect-h-1">
              <Image
                src={image.src}
                alt={image.alt}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={image.dataAiHint || image.alt.toLowerCase().replace(/\s+/g, ' ')}
              />
              {image.caption && (
                <figcaption className="absolute bottom-0 left-0 right-0 p-3 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {image.caption}
                </figcaption>
              )}
              {enableLightbox && (
                <a href={image.src} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label={`View image ${image.alt} in lightbox (opens in new tab)`}></a>
              )}
            </figure>
          ))}
        </div>
        {enableLightbox && <p className="text-center text-xs text-muted-foreground mt-4">(Lightbox functionality is conceptual here; links open image directly)</p>}
      </div>
    </section>
  );
};

export default GalleryRenderer;
