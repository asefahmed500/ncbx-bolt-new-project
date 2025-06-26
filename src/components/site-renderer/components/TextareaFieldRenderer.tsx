
import type { IPageComponent } from '@/models/PageComponent';

interface TextareaFieldRendererProps {
  config: IPageComponent['config'];
}

const TextareaFieldRenderer: React.FC<TextareaFieldRendererProps> = ({ config }) => {
    const label = config?.label || 'Textarea Field';
    const placeholder = config?.placeholder || 'Enter a longer message...';
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <textarea placeholder={placeholder} disabled className="w-full px-3 py-2 border border-input rounded-md bg-input cursor-not-allowed" rows={4}></textarea>
    </div>
  );
};

export default TextareaFieldRenderer;
