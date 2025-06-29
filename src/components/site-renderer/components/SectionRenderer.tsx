
"use client";
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';

interface SectionRendererProps {
  config: IPageComponent['config'];
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ config }) => {
  const elements: IPageComponent[] = config?.elements || [];
  const backgroundColor = config?.backgroundColor || 'transparent';
  const paddingTop = config?.paddingTop || '20px';
  const paddingBottom = config?.paddingBottom || '20px';

  const style: React.CSSProperties = {
    backgroundColor,
    paddingTop,
    paddingBottom,
    width: '100%',
  };
  
  return (
    <section style={style}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="min-h-[20px]">
          {elements.map((element) => (
            <ElementRenderer key={element._id as string} element={element}/>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionRenderer;
