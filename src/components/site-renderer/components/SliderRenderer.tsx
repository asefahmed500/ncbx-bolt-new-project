
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Slide {
  src: string;
  alt?: string;
  caption?: string;
  dataAiHint?: string;
}

interface SliderRendererProps {
  config: IPageComponent['config'];
}

const SliderRenderer: React.FC<SliderRendererProps> = ({ config }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const images: Slide[] = config?.images || [
    { src: "https://placehold.co/1200x600.png", alt: "Slide 1", dataAiHint: "slide show one" },
    { src: "https://placehold.co/1200x600.png", alt: "Slide 2", dataAiHint: "slide show two" },
    { src: "https://placehold.co/1200x600.png", alt: "Slide 3", dataAiHint: "slide show three" },
  ];

  if (images.length === 0) {
    return (
      <section className="py-8 my-4 relative bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="aspect-[2/1] w-full bg-muted flex items-center justify-center rounded-lg">
            <p className="text-muted-foreground">No images in slider</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 my-4 relative">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {images.map((image, index) => (
            <div className="embla__slide" key={index}>
              <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={image.src}
                  alt={image.alt || `Slider image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                  data-ai-hint={image.dataAiHint || "carousel image"}
                />
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4 text-white text-center">
                    <p>{image.caption}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="absolute top-1/2 left-4 -translate-y-1/2 bg-white/50 hover:bg-white/80 p-2 rounded-full text-black" onClick={scrollPrev}>
        <ArrowLeft className="h-6 w-6" />
      </button>
      <button className="absolute top-1/2 right-4 -translate-y-1/2 bg-white/50 hover:bg-white/80 p-2 rounded-full text-black" onClick={scrollNext}>
        <ArrowRight className="h-6 w-6" />
      </button>

      <style jsx global>{`
        .embla {
          overflow: hidden;
        }
        .embla__container {
          display: flex;
        }
        .embla__slide {
          flex: 0 0 100%;
          min-width: 0;
        }
      `}</style>
    </section>
  );
};

export default SliderRenderer;
