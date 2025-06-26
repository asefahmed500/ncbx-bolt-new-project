
"use client";
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';
import { useDroppable } from '@dnd-kit/core';

interface Column {
  id: string; // Unique ID for droppable
  elements: IPageComponent[];
}

interface ColumnsRendererProps {
  config: IPageComponent['config'];
  isEditor?: boolean;
}

const ColumnDropArea = ({ column, isEditor }: { column: Column, isEditor: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={isEditor ? setNodeRef : undefined}
      className={`flex flex-col min-w-0 h-full transition-colors ${
        isEditor && isOver ? 'bg-primary/10' : ''
      } ${isEditor && !column.elements.length ? 'p-4 border-2 border-dashed border-muted rounded-md min-h-[100px] items-center justify-center text-muted-foreground text-xs' : ''}`}
    >
      {column.elements.length > 0 ? (
        (column.elements || []).map((element) => (
          <ElementRenderer key={element._id as string} element={element}/>
        ))
      ) : isEditor ? (
        <span>Drop Here</span>
      ) : null}
    </div>
  );
}

const ColumnsRenderer: React.FC<ColumnsRendererProps> = ({ config, isEditor = false }) => {
  const gap = config?.gap || '1rem';
  const columnsData: Column[] = config?.columns || [];
  const columnCount = columnsData.length;

  let gridClasses = 'grid-cols-1';
  if (columnCount === 2) gridClasses = 'md:grid-cols-2';
  if (columnCount === 3) gridClasses = 'md:grid-cols-3';
  if (columnCount === 4) gridClasses = 'md:grid-cols-2 lg:grid-cols-4';


  return (
    <div className={`grid ${gridClasses} w-full`} style={{ gap }}>
      {columnsData.map((column, index) => (
        <ColumnDropArea key={column.id || index} column={column} isEditor={isEditor} />
      ))}
    </div>
  );
};

export default ColumnsRenderer;

    