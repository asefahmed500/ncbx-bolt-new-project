
import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image';

interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  dataAiHint?: string;
}

interface TestimonialsRendererProps {
  config: IPageComponent['config'];
}

const TestimonialsRenderer: React.FC<TestimonialsRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'What Our Clients Say';
  const items: TestimonialItem[] = config?.items || [
    { quote: "This platform is a game-changer! It helped us scale our business significantly.", author: "Jane Miller", role: "CEO, Tech Solutions", avatar: "https://placehold.co/100x100.png?text=JM", dataAiHint:"happy customer" },
    { quote: "Incredible support and a fantastic product. Highly recommended!", author: "John Davis", role: "Marketing Manager, Creative Co.", avatar: "https://placehold.co/100x100.png?text=JD", dataAiHint:"satisfied user person"},
  ];
  const layout = config?.layout || 'carousel'; // 'grid' or 'carousel' (carousel is conceptual for now)

  return (
    <section className="py-12 md:py-20 bg-muted/30 text-foreground">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className={`gap-8 ${layout === 'grid' ? 'grid md:grid-cols-1 lg:grid-cols-2' : 'space-y-8'}`}>
          {items.map((item, index) => (
            <div key={index} className="bg-card p-8 rounded-xl shadow-xl border border-border">
              {item.avatar && (
                <div className="relative w-16 h-16 mx-auto md:mx-0 md:float-left md:mr-6 mb-4 md:mb-0 rounded-full overflow-hidden border-2 border-accent">
                  <Image
                    src={item.avatar}
                    alt={item.author}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint={item.dataAiHint || "client avatar person"}
                  />
                </div>
              )}
              <blockquote className="text-lg italic text-card-foreground mb-4">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <footer className="text-right md:text-left md:pl-[calc(4rem+1.5rem)]"> {/* Adjust pl if avatar size changes */}
                <p className="font-semibold text-primary">{item.author}</p>
                {item.role && <p className="text-sm text-muted-foreground">{item.role}</p>}
              </footer>
            </div>
          ))}
        </div>
        {layout === 'carousel' && <p className="text-center text-xs text-muted-foreground mt-4">(Carousel layout is conceptual and renders as list for now)</p>}
      </div>
    </section>
  );
};

export default TestimonialsRenderer;
