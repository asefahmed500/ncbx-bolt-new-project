
import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image'; // Using next/image for card images

interface CardConfig {
  title: string;
  description: string;
  image?: string;
  link?: string;
  dataAiHint?: string;
}

interface CardSectionRendererProps {
  config: IPageComponent['config'];
}

const CardSectionRenderer: React.FC<CardSectionRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Featured Content';
  const cards: CardConfig[] = config?.cards || [
    { title: "Card 1", description: "Placeholder description for card 1.", image: "https://placehold.co/300x200.png?text=Card+1", dataAiHint: "feature item", link: "#" },
    { title: "Card 2", description: "Placeholder description for card 2.", image: "https://placehold.co/300x200.png?text=Card+2", dataAiHint: "product service", link: "#" },
    { title: "Card 3", description: "Placeholder description for card 3.", image: "https://placehold.co/300x200.png?text=Card+3", dataAiHint: "information block", link: "#" },
  ];
  const backgroundColor = config?.backgroundColor || 'bg-muted/30';
  const textColor = config?.textColor || 'text-neutral-800';

  return (
    <section className={`py-16 md:py-24 ${backgroundColor} ${textColor}`}>
      <div className="container mx-auto px-6">
        {sectionTitle && <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div key={index} className="bg-card rounded-lg shadow-lg overflow-hidden flex flex-col border border-border">
              <div className="relative w-full h-48">
                <Image
                  src={card.image || "https://placehold.co/300x200.png"}
                  alt={card.title}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={card.dataAiHint || card.title.toLowerCase().replace(/\s+/g, ' ')}
                />
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <h3 className="text-xl font-semibold font-headline mb-2 text-card-foreground">{card.title}</h3>
                <p className="text-muted-foreground text-sm flex-grow">{card.description}</p>
                {card.link && (
                  <a href={card.link} className="mt-4 inline-block text-primary hover:underline font-medium">
                    Learn More &rarr;
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CardSectionRenderer;
