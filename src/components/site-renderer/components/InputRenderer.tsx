
import type { IPageComponent } from '@/models/PageComponent';

interface InputRendererProps {
  config: IPageComponent['config'];
}

const InputRenderer: React.FC<InputRendererProps> = ({ config }) => {
    const label = config?.label || 'Input Field';
    const type = config?.type || 'text';
    const placeholder = config?.placeholder || 'Enter value...';
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} placeholder={placeholder} disabled className="w-full px-3 py-2 border border-input rounded-md bg-input cursor-not-allowed" />
    </div>
  );
};

export default InputRenderer;
