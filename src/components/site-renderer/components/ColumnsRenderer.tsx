
"use client";
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface Column {
  id: string; // Unique ID for droppable
  elements: IPageComponent[];
}

interface ColumnsRendererProps {
  config: IPageComponent['config'];
}

const ColumnDropArea = ({ column }: { column: Column }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id, // Use the unique ID from the column data
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex flex-col min-w-0 h-full min-h-[100px] p-2 rounded-md transition-colors",
        isOver ? "bg-primary/10 border-2 border-dashed border-primary" : "border-2 border-transparent"
      )}
    >
      {(column.elements || []).map((element) => (
        <ElementRenderer key={element._id as string} element={element}/>
      ))}
      {column.elements.length === 0 && isOver && (
        <div className="text-center text-primary text-sm font-semibold flex-grow flex items-center justify-center">
            Drop here
        </div>
      )}
       {column.elements.length > 0 && isOver && (
         <div className="text-center text-primary text-sm font-semibold p-4 border-2 border-dashed border-primary rounded-md mt-2">
          Drop here
        </div>
      )}
    </div>
  );
}

const ColumnsRenderer: React.FC<ColumnsRendererProps> = ({ config }) => {
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
        <ColumnDropArea key={column.id || index} column={column} />
      ))}
    </div>
  );
};

export default ColumnsRenderer;
