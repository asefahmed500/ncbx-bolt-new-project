
import type { IPageComponent } from '@/models/PageComponent';

interface CustomCodeRendererProps {
    config: IPageComponent['config'];
}

const CustomCodeRenderer: React.FC<CustomCodeRendererProps> = ({ config }) => {
    const html = config?.html || '<div><!-- Your Custom HTML Code Here --></div>';
  return (
    <div className="my-2 border border-dashed p-2 bg-muted/20">
        <p className="text-xs text-muted-foreground mb-2">Custom Code Block (Preview may be limited in editor)</p>
        <div dangerouslySetInnerHTML={{ __html: html as string }} />
    </div>
  );
};

export default CustomCodeRenderer;
