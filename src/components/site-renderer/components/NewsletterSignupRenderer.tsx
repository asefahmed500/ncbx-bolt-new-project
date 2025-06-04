import type { IPageComponent } from '@/models/PageComponent';

interface NewsletterSignupRendererProps {
  config: IPageComponent['config'];
}

const NewsletterSignupRenderer: React.FC<NewsletterSignupRendererProps> = ({ config }) => {
  const title = config?.title || 'Stay Updated';
  const description = config?.description || 'Subscribe to our newsletter for the latest news and offers.';
  const placeholder = config?.placeholder || 'Enter your email address';
  const buttonText = config?.buttonText || 'Subscribe';
  const formActionUrl = config?.formActionUrl; // URL for form submission

  return (
    <section className="py-12 md:py-16 bg-muted/30 text-foreground">
      <div className="container mx-auto px-6 max-w-xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-headline mb-3">{title}</h2>
        {description && <p className="text-muted-foreground mb-6">{description}</p>}
        <form 
          action={formActionUrl || '#'} 
          method={formActionUrl ? 'POST' : 'GET'} // Simple GET if no action URL
          className="flex flex-col sm:flex-row gap-3 items-center justify-center"
          onSubmit={(e) => { if(!formActionUrl) e.preventDefault(); alert('Newsletter signup (conceptual)')}}
        >
          <input
            type="email"
            name="email"
            placeholder={placeholder}
            required
            className="flex-grow w-full sm:w-auto px-4 py-2.5 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-input text-base"
            aria-label="Email for newsletter"
          />
          <button
            type="submit"
            className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium shadow-md text-base"
          >
            {buttonText}
          </button>
        </form>
         {!formActionUrl && <p className="text-xs text-muted-foreground mt-3">(This is a conceptual form. Backend integration needed.)</p>}
      </div>
    </section>
  );
};

export default NewsletterSignupRenderer;
