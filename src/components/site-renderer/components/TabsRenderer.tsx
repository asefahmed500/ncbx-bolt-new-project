
// This component is a conceptual placeholder.
// A real implementation would use ShadCN's Tabs component and require client-side interactivity.

import type { IPageComponent } from '@/models/PageComponent';

interface TabItem {
  title: string;
  content: string;
}

interface TabsRendererProps {
  config: IPageComponent['config'];
}

const TabsRenderer: React.FC<TabsRendererProps> = ({ config }) => {
  const items: TabItem[] = config?.items || [
    { title: "Tab 1", content: "<p>Content for the first tab goes here.</p>" },
    { title: "Tab 2", content: "<p>Content for the second tab is shown here.</p>" },
    { title: "Tab 3", content: "<p>And this is the content for the third tab.</p>" },
  ];

  // For this conceptual renderer, we'll display the tabs and the content of the first tab.
  const firstItem = items[0];

  return (
    <section className="py-8 my-4">
      <div className="container mx-auto px-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {items.map((item, index) => (
              <a
                key={item.title}
                href="#"
                onClick={(e) => e.preventDefault()} // Disable click in editor
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  index === 0
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {item.title}
              </a>
            ))}
          </nav>
        </div>
        <div className="pt-6">
          {firstItem ? (
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: firstItem.content }}
            />
          ) : (
            <p className="text-muted-foreground">No content for tabs.</p>
          )}
          <p className="text-center text-xs text-muted-foreground mt-4">
            (Interactive tabs will be rendered on the live site)
          </p>
        </div>
      </div>
    </section>
  );
};

export default TabsRenderer;
