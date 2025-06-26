
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  if (items.length === 0) {
    return (
        <section className="py-8 my-4">
            <div className="container mx-auto px-6">
                 <p className="text-muted-foreground">No tabs configured.</p>
            </div>
        </section>
    );
  }

  return (
    <section className="py-8 my-4">
      <div className="container mx-auto px-6">
        <Tabs defaultValue={items[0].title} className="w-full">
          <TabsList>
            {items.map((item) => (
              <TabsTrigger key={item.title} value={item.title}>
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {items.map((item) => (
            <TabsContent key={item.title} value={item.title} className="pt-6">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default TabsRenderer;
