import type { IPageComponent } from '@/models/PageComponent';

interface ContactFormRendererProps {
  config: IPageComponent['config'];
}

const ContactFormRenderer: React.FC<ContactFormRendererProps> = ({ config }) => {
  const title = config?.title || 'Contact Us';
  const recipientEmail = config?.recipientEmail || 'info@example.com'; // This would be handled server-side
  const submitButtonText = config?.submitButtonText || 'Send Message';

  // Basic form structure. Real form submission would require server-side logic.
  return (
    <section className="py-12 md:py-20 bg-background text-foreground">
      <div className="container mx-auto px-6 max-w-xl">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-10">{title}</h2>
        <form action={`mailto:${recipientEmail}`} method="post" encType="text/plain" className="space-y-6 bg-card p-8 rounded-lg shadow-xl border border-border">
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
            <button type="submit" className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium shadow-md">
              {submitButtonText}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Note: This is a basic mailto form. For robust submissions, backend integration is needed.</p>
        </form>
      </div>
    </section>
  );
};

export default ContactFormRenderer;
