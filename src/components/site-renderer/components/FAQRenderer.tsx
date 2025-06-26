
import type { IPageComponent } from '@/models/PageComponent';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQRendererProps {
  config: IPageComponent['config'];
}

// Basic non-interactive accordion for now. Real one would use ShadCN's Accordion or similar.
const FAQRenderer: React.FC<FAQRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Frequently Asked Questions';
  const items: FAQItem[] = config?.items || [
    { question: "What services do you offer?", answer: "We offer a wide range of services tailored to your needs." },
    { question: "How can I get started?", answer: "Simply sign up on our website or contact our support team." },
    { question: "What are your pricing plans?", answer: "We have flexible pricing plans to suit different requirements. Please check our pricing page." },
  ];
  const itemBackgroundColor = config?.itemBackgroundColor || 'bg-muted/50';
  const questionTextColor = config?.questionTextColor || 'text-foreground font-semibold';
  const answerTextColor = config?.answerTextColor || 'text-muted-foreground';

  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className="space-y-4">
          {items.map((item, index) => (
            <details key={index} className={`p-6 rounded-lg shadow-md border border-border ${itemBackgroundColor} group`}>
              <summary className={`cursor-pointer ${questionTextColor} text-lg list-none flex justify-between items-center`}>
                {item.question}
                <span className="text-primary transition-transform duration-200 group-open:rotate-180">&darr;</span>
              </summary>
              <div className={`mt-4 ${answerTextColor} text-sm leading-relaxed`}>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQRenderer;
