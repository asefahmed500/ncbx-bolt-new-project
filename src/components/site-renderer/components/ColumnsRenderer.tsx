
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
}

const ColumnDropArea = ({ column }: { column: Column }) => {
  // isEditor functionality is handled in the main editor component
  // This renderer is now just for display
  return (
    <div className="flex flex-col min-w-0 h-full">
      {(column.elements || []).map((element) => (
        <ElementRenderer key={element._id as string} element={element}/>
      ))}
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
