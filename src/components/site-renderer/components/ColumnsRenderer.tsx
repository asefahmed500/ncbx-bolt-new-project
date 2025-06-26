
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';

interface Column {
  id: string; // Unique ID for droppable
  elements: IPageComponent[];
}

interface ColumnsRendererProps {
  config: IPageComponent['config'];
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
        <div key={column.id || index} className="flex flex-col min-w-0">
          {(column.elements || []).map((element) => (
            <ElementRenderer key={element._id as string} element={element} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ColumnsRenderer;
