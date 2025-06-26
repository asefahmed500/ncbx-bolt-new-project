
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import { useSession } from 'next-auth/react';
import ElementRenderer from '../ElementRenderer';
import { Lock } from 'lucide-react';

interface LockedContentRendererProps {
  config: IPageComponent['config'];
}

const LockedContentRenderer: React.FC<LockedContentRendererProps> = ({ config }) => {
  const { data: session } = useSession();
  const upgradeMessage = config?.upgradeMessage || 'Upgrade to Pro to view this content';
  
  // A user has access if they are on the 'pro' or 'enterprise' plan.
  const hasAccess = session?.user?.subscriptionPlanId === 'pro' || session?.user?.subscriptionPlanId === 'enterprise';
  
  const elements = config?.elements || [];

  return (
    <section className="py-8 my-4">
      {hasAccess ? (
        <div>
          {elements.map((element: IPageComponent) => (
            <ElementRenderer key={element._id as string} element={element} />
          ))}
        </div>
      ) : (
        <div className="p-8 bg-muted/30 border-2 border-dashed border-accent rounded-lg text-center">
          <Lock className="h-8 w-8 mx-auto text-accent mb-4" />
          <p className="font-semibold text-accent-foreground mb-4">{upgradeMessage}</p>
          <a href="/pricing" className="inline-block bg-accent text-accent-foreground px-5 py-2 rounded-md hover:bg-accent/90 transition-colors">
            Upgrade Now
          </a>
        </div>
      )}
    </section>
  );
};

export default LockedContentRenderer;
