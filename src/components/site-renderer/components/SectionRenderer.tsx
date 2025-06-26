
"use client";
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  config: IPageComponent['config'];
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ config }) => {
  const elements: IPageComponent[] = config?.elements || [];
  const backgroundColor = config?.backgroundColor || 'transparent';
  const paddingTop = config?.paddingTop || '20px';
  const paddingBottom = config?.paddingBottom || '20px';

  const { setNodeRef, isOver } = useDroppable({
    id: config.id,
  });

  const style: React.CSSProperties = {
    backgroundColor,
    paddingTop,
    paddingBottom,
    width: '100%',
  };
  
  return (
    <section style={style}>
      <div 
        ref={setNodeRef}
        className={cn(
          "container mx-auto px-4 md:px-6 transition-colors rounded-md", 
          isOver ? "bg-primary/10" : ""
        )}
      >
        <div
          className={cn(
            "min-h-[60px] p-2",
            isOver ? "border-2 border-dashed border-primary rounded-md" : "border-2 border-transparent"
          )}
        >
          {elements.length > 0 ? (
            elements.map((element) => (
              <ElementRenderer key={element._id as string} element={element}/>
            ))
          ) : (
            <div className="text-center text-primary text-sm font-semibold h-full flex items-center justify-center min-h-[60px]">
              {isOver ? 'Drop here' : ''}
            </div>
          )}
          {elements.length > 0 && isOver && (
             <div className="text-center text-primary text-sm font-semibold p-4 border-2 border-dashed border-primary rounded-md mt-2">
              Drop here to add to bottom of section
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SectionRenderer;
