
import type { IPageComponent } from '@/models/PageComponent';

interface LockedContentRendererProps {
  config: IPageComponent['config'];
}

const LockedContentRenderer: React.FC<LockedContentRendererProps> = ({ config }) => {
  const upgradeMessage = config?.upgradeMessage || 'Upgrade to Pro to view this content';
  
  // In a real app, you would check the user's subscription status here.
  // For rendering purposes, we'll assume the user does not have access.
  const hasAccess = false; 
  
  const elements = config?.elements || [];

  return (
    <section className="py-8 my-4 bg-muted/30 border-2 border-dashed border-accent rounded-lg text-center">
        {hasAccess ? (
            <div>
                 {/* In a real scenario, you would render the nested elements here */}
                 <p className="text-sm text-green-600">(User has access - Content would render here)</p>
            </div>
        ) : (
            <div className="p-6">
                <p className="font-semibold text-accent-foreground mb-2">{upgradeMessage}</p>
                <a href="/pricing" className="inline-block bg-accent text-accent-foreground px-5 py-2 rounded-md hover:bg-accent/90 transition-colors">
                    Upgrade Now
                </a>
            </div>
        )}
    </section>
  );
};

export default LockedContentRenderer;
