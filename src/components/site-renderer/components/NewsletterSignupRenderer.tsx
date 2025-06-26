
"use client";

import { useState } from 'react';
import type { IPageComponent } from '@/models/PageComponent';
import { handleNewsletterSignup } from '@/actions/forms';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NewsletterSignupRendererProps {
  config: IPageComponent['config'];
}

const NewsletterSignupRenderer: React.FC<NewsletterSignupRendererProps> = ({ config }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'success'>('idle');

  const title = config?.title || 'Stay Updated';
  const description = config?.description || 'Subscribe to our newsletter for the latest news and offers.';
  const placeholder = config?.placeholder || 'Enter your email address';
  const buttonText = config?.buttonText || 'Subscribe';

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);

    const result = await handleNewsletterSignup(formData);
    
    if (result.success) {
        toast({ title: "Subscribed!", description: result.message });
        setFormState('success');
    } else {
        toast({ title: "Error", description: result.error, variant: 'destructive' });
    }
    
    setIsLoading(false);
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30 text-foreground">
      <div className="container mx-auto px-6 max-w-xl text-center">
        <h2 className="text-2xl md:text-3xl font-bold font-headline mb-3">{title}</h2>
        {description && <p className="text-muted-foreground mb-6">{description}</p>}
        {formState === 'success' ? (
          <p className="text-lg text-green-700 dark:text-green-400 font-semibold">Thank you for subscribing!</p>
        ) : (
          <form 
            action={handleSubmit} 
            className="flex flex-col sm:flex-row gap-3 items-center justify-center"
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
              className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors font-medium shadow-md text-base flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buttonText}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default NewsletterSignupRenderer;
