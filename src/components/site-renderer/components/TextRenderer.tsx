
import type { IPageComponent } from '@/models/PageComponent';

interface TextRendererProps {
  config: IPageComponent['config'];
}

const TextRenderer: React.FC<TextRendererProps> = ({ config }) => {
  const htmlContent = config?.htmlContent || '<p>Default text content. Edit this in the editor.</p>';
  const alignment = config?.alignment || 'left';
  const color = config?.color;
  const fontSize = config?.fontSize;
  
  const style: React.CSSProperties = {
    textAlign: alignment as 'left' | 'center' | 'right' | 'justify',
    color: color || undefined,
    fontSize: fontSize || undefined,
    // fontFamily: config?.fontFamily || undefined, // Could be added
  };

  // Tailwind classes can be added here based on config, e.g.,
  // let tailwindClasses = "prose dark:prose-invert max-w-none";
  // if (alignment === 'center') tailwindClasses += " text-center";
  // etc.

  return (
    <div
      style={style}
      className="my-2 leading-relaxed" // Basic Tailwind for readability
      dangerouslySetInnerHTML={{ __html: htmlContent as string }}
    />
  );
};

export default TextRenderer;
