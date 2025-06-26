
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';
import { useDroppable } from '@dnd-kit/core';

interface SectionRendererProps {
  config: IPageComponent['config'];
  id: string; // The ID of the section for dnd-kit
  isOver: boolean;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ config, id, isOver }) => {
  const { setNodeRef } = useDroppable({ id });
  const elements: IPageComponent[] = config?.elements || [];
  const backgroundColor = config?.backgroundColor || 'transparent';
  const paddingTop = config?.paddingTop || '20px';
  const paddingBottom = config?.paddingBottom || '20px';

  const style: React.CSSProperties = {
    backgroundColor,
    paddingTop,
    paddingBottom,
  };

  return (
    <section ref={setNodeRef} style={style} className={`transition-colors ${isOver ? 'bg-primary/10' : ''}`}>
      <div className="container mx-auto px-6">
        {elements.length === 0 && isOver && (
            <div className="p-4 border-2 border-dashed border-primary rounded-md text-center text-primary">
                Drop here
            </div>
        )}
        {elements.map((element) => (
          <ElementRenderer key={element._id as string} element={element} />
        ))}
      </div>
    </section>
  );
};

export default SectionRenderer;
