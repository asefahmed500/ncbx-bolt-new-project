
import type { IPageComponent } from '@/models/PageComponent';

interface HeadingRendererProps {
  config: IPageComponent['config'];
}

const HeadingRenderer: React.FC<HeadingRendererProps> = ({ config }) => {
  const Tag = config?.level || 'h2'; // Default to h2 if level is not specified
  const text = config?.text || 'Default Heading';
  const color = config?.color || 'inherit';
  const fontSize = config?.fontSize || undefined; // Let Tailwind/browser handle default if not set
  const alignment = config?.alignment || 'left'; // left, center, right
  
  const style: React.CSSProperties = {
    color: color,
    fontSize: fontSize,
    textAlign: alignment as 'left' | 'center' | 'right',
  };

  // Basic Tailwind classes for common heading sizes (can be expanded)
  let tailwindClasses = "font-bold";
  switch (Tag) {
    case "h1": tailwindClasses += " text-4xl md:text-5xl"; break;
    case "h2": tailwindClasses += " text-3xl md:text-4xl"; break;
    case "h3": tailwindClasses += " text-2xl md:text-3xl"; break;
    case "h4": tailwindClasses += " text-xl md:text-2xl"; break;
    case "h5": tailwindClasses += " text-lg md:text-xl"; break;
    case "h6": tailwindClasses += " text-base md:text-lg"; break;
  }
  
  // Apply alignment, color and fontSize if they are explicitly not Tailwind defaults
  // This primitive example prioritizes Tailwind classes if generic styling is desired,
  // but allows config to override for specific inline styles.
  // A more robust system would map config options directly to Tailwind classes where possible.

  return <Tag style={style} className={tailwindClasses}>{text}</Tag>;
};

export default HeadingRenderer;
