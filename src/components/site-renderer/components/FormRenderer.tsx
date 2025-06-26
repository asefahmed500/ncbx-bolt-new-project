
import type { IPageComponent } from '@/models/PageComponent';
import ElementRenderer from '../ElementRenderer';

interface FormRendererProps {
  config: IPageComponent['config'];
}

const FormRenderer: React.FC<FormRendererProps> = ({ config }) => {
    const buttonText = config?.buttonText || 'Submit';
    const elements: IPageComponent[] = config?.elements || [];
  return (
    <form className="space-y-4 p-4 border border-dashed rounded-md bg-muted/20">
        {elements.map((element) => (
            <ElementRenderer key={element._id as string} element={element} />
        ))}
        <button type="button" className="px-4 py-2 bg-primary text-primary-foreground rounded-md w-full cursor-not-allowed">
            {buttonText}
        </button>
         <p className="text-xs text-center text-muted-foreground">(Form submission is handled by your server configuration)</p>
    </form>
  );
};

export default FormRenderer;
