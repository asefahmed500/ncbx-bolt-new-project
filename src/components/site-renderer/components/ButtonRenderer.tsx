
import type { IPageComponent } from '@/models/PageComponent';
import { createElement } from 'react';
import * as Icons from 'lucide-react';

interface ButtonRendererProps {
  config: IPageComponent['config'];
}

const ButtonRenderer: React.FC<ButtonRendererProps> = ({ config }) => {
  const text = config?.text || 'Button';
  const link = config?.link || '#';
  const style = config?.style || 'primary'; // primary, secondary, outline
  const openInNewTab = config?.openInNewTab === true;
  const alignment = config?.alignment || 'left'; // left, center, right
  const icon = config?.icon; // e.g., "CheckCircle"
  const iconPosition = config?.iconPosition || 'left'; // 'left' or 'right'

  const getStyleClasses = () => {
    switch(style) {
        case 'secondary': return 'bg-gray-500 text-white hover:bg-gray-600';
        case 'outline': return 'border border-primary text-primary hover:bg-primary/10';
        case 'primary':
        default: return 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
  }
  
  const getAlignmentClasses = () => {
    switch(alignment) {
        case 'center': return 'text-center';
        case 'right': return 'text-right';
        case 'left':
        default: return 'text-left';
    }
  }

  const IconComponent = icon && (Icons as any)[icon] ? createElement((Icons as any)[icon], {className: 'h-4 w-4'}) : null;

  return (
    <div className={`my-2 ${getAlignmentClasses()}`}>
      <a
        href={link}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        className={`inline-flex items-center gap-2 px-6 py-2.5 my-2 rounded-md font-medium shadow-md transition-colors ${getStyleClasses()}`}
      >
        {iconPosition === 'left' && IconComponent}
        {text}
        {iconPosition === 'right' && IconComponent}
      </a>
    </div>
  );
};

export default ButtonRenderer;
