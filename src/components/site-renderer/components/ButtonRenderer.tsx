
import type { IPageComponent } from '@/models/PageComponent';

interface ButtonRendererProps {
  config: IPageComponent['config'];
}

const ButtonRenderer: React.FC<ButtonRendererProps> = ({ config }) => {
  const text = config?.text || 'Button';
  const link = config?.link || '#';
  const style = config?.style || 'primary'; // primary, secondary, outline
  const openInNewTab = config?.openInNewTab === true;

  // Basic styling - in a real app, these would be Tailwind classes or styled-components
  const baseStyle = "display: inline-block; padding: 0.5em 1em; margin: 0.5em 0; border-radius: 0.25em; text-decoration: none; cursor: pointer; border: 1px solid transparent;";
  let specificStyle = "";

  switch (style) {
    case 'secondary':
      specificStyle = "background-color: #6c757d; color: white; border-color: #6c757d;";
      break;
    case 'outline':
      specificStyle = "background-color: transparent; color: #007bff; border-color: #007bff;";
      break;
    case 'primary':
    default:
      specificStyle = "background-color: #007bff; color: white; border-color: #007bff;";
      break;
  }
  
  const alignment = config?.alignment || 'left'; // left, center, right
  const textAlignStyle = `text-align: ${alignment};`;

  return (
    <div style={{ textAlign: alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left' }}>
      <a
        href={link}
        target={openInNewTab ? '_blank' : '_self'}
        rel={openInNewTab ? 'noopener noreferrer' : undefined}
        style={{ cssText: `${baseStyle} ${specificStyle}` } as any}
        className={`inline-block px-4 py-2 my-2 rounded 
          ${style === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
          ${style === 'secondary' ? 'bg-gray-500 text-white hover:bg-gray-600' : ''}
          ${style === 'outline' ? 'border border-blue-500 text-blue-500 hover:bg-blue-50' : ''}
        `}
      >
        {config?.iconLeft && <span className="mr-2">{config.iconLeft}</span>}
        {text}
        {config?.iconRight && <span className="ml-2">{config.iconRight}</span>}
      </a>
    </div>
  );
};

export default ButtonRenderer;
