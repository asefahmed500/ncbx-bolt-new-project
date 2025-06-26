
import type { IPageComponent } from '@/models/PageComponent';

interface DividerRendererProps {
  config: IPageComponent['config'];
}

const DividerRenderer: React.FC<DividerRendererProps> = ({ config }) => {
  const style = config?.style || 'solid'; // solid, dashed, dotted
  const color = config?.color || '#cccccc';
  const height = config?.height || '1px';
  const marginY = config?.marginY || '16px';

  const borderStyle = `${height} ${style} ${color}`;

  return (
    <hr
      style={{
        border: 'none',
        borderTop: borderStyle,
        margin: `${marginY} 0`,
      }}
    />
  );
};

export default DividerRenderer;
