
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

const ColumnDroppable: React.FC<{
  id: string;
  isOver: boolean;
  children: React.ReactNode;
}> = ({ id, isOver, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-2 transition-colors ${isOver ? 'bg-primary/10' : ''}`}
    >
      {children}
    </div>
  );
};


const ColumnsRenderer: React.FC<ColumnsRendererProps> = ({ config }) => {
  const gap = config?.gap || '16px';
  const columnsData: Column[] = config?.columns || [];

  return (
    <div className="flex flex-col md:flex-row" style={{ gap }}>
      {columnsData.map((column, index) => (
        <div key={column.id || index} className="flex-1 min-w-0">
          {(column.elements || []).map((element) => (
            <ElementRenderer key={element._id as string} element={element} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ColumnsRenderer;
