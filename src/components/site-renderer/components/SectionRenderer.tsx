
"use client";
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';
import { useDroppable } from '@dnd-kit/core';

interface SectionRendererProps {
  config: IPageComponent['config'];
  isEditor?: boolean;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ config, isEditor = false }) => {
  const elements: IPageComponent[] = config?.elements || [];
  const backgroundColor = config?.backgroundColor || 'transparent';
  const paddingTop = config?.paddingTop || '20px';
  const paddingBottom = config?.paddingBottom || '20px';

  const style: React.CSSProperties = {
    backgroundColor,
    paddingTop,
    paddingBottom,
  };
  
  const { setNodeRef, isOver } = useDroppable({ id: config?.id || 'section-drop-area' });


  return (
    <section style={style}>
      <div 
        ref={isEditor ? setNodeRef : undefined}
        className={`container mx-auto px-4 md:px-6 transition-colors ${
          isEditor && isOver ? 'bg-primary/10' : ''
        } ${isEditor && !elements.length ? 'py-10 border-2 border-dashed border-muted rounded-md min-h-[100px] flex items-center justify-center text-muted-foreground' : ''}`}
      >
        {elements.length > 0 ? (
          elements.map((element) => (
            <ElementRenderer key={element._id as string} element={element} isEditor={isEditor}/>
          ))
        ) : isEditor ? (
            <span>Drop Components Here</span>
        ) : null}
      </div>
    </section>
  );
};

export default SectionRenderer;

    