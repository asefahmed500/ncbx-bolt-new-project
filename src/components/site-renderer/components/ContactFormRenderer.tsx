
"use client";

import { useState } from 'react';
import type { IPageComponent } from '@/models/PageComponent';
import { handleContactFormSubmit } from '@/actions/forms';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ContactFormRendererProps {
  config: IPageComponent['config'];
}

const ContactFormRenderer: React.FC<ContactFormRendererProps> = ({ config }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'success' | 'error'>('idle');

  const title = config?.title || 'Contact Us';
  const submitButtonText = config?.submitButtonText || 'Send Message';

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setFormState('idle');

    const result = await handleContactFormSubmit(formData);

    if (result.success) {
      toast({ title: "Message Sent!", description: result.message });
      setFormState('success');
    } else {
      toast({ title: "Error", description: result.error, variant: 'destructive' });
      setFormState('error');
    }

    setIsLoading(false);
  }

  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6 max-w-xl">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-10">{title}</h2>
        {formState === 'success' ? (
          <div className="text-center bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 p-6 rounded-lg">
            <h3 className="font-semibold text-lg">Thank You!</h3>
            <p>Your message has been sent successfully.</p>
          </div>
        ) : (
          <form action={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg shadow-xl border border-border">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-1">Full Name</label>
              <input type="text" name="name" id="name" required className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-input" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-1">Email Address</label>
              <input type="email" name="email" id="email" required className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-input" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-card-foreground mb-1">Subject</label>
              <input type="text" name="subject" id="subject" className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-input" />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-card-foreground mb-1">Message</label>
              <textarea name="message" id="message" rows={4} required className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:ring-primary focus:border-primary bg-input"></textarea>
            </div>
            <div>
              <button type="submit" className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium shadow-md flex items-center justify-center" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitButtonText}
              </button>
            </div>
            {formState === 'error' && (
                <p className="text-sm text-center text-destructive">There was an error sending your message. Please try again.</p>
            )}
          </form>
        )}
      </div>
    </section>
  );
};

export default ContactFormRenderer;
