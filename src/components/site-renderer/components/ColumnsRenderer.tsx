
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';

interface Column {
  elements: IPageComponent[];
}

interface ColumnsRendererProps {
  config: IPageComponent['config'];
}

const ColumnsRenderer: React.FC<ColumnsRendererProps> = ({ config }) => {
  const gap = config?.gap || '16px';
  const columnsData: Column[] = config?.columns || [];

  return (
    <div className="flex flex-col md:flex-row" style={{ gap }}>
      {columnsData.map((column, index) => (
        <div key={index} className="flex-1">
          {(column.elements || []).map((element) => (
            <ElementRenderer key={element._id as string} element={element} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ColumnsRenderer;
