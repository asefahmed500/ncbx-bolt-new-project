
import type { IPageComponent } from '@/models/PageComponent';

interface SpacerRendererProps {
  config: IPageComponent['config'];
}

const SpacerRenderer: React.FC<SpacerRendererProps> = ({ config }) => {
  const height = config?.height || '4rem'; // e.g., '2rem', '50px'

  return (
    <div
      style={{
        height,
      }}
      aria-hidden="true"
      className="w-full"
    />
  );
};

export default SpacerRenderer;
