
import type { IPageComponent } from '@/models/PageComponent';
import NextImage from 'next/image'; // Using next/image for optimization if possible

interface ImageRendererProps {
  config: IPageComponent['config'];
}

const ImageRenderer: React.FC<ImageRendererProps> = ({ config }) => {
  const src = config?.src || 'https://placehold.co/600x400.png?text=Placeholder';
  const alt = config?.alt || 'Website image';
  const width = config?.width || '100%'; // Can be like "600px" or "100%"
  const height = config?.height || 'auto'; // Can be like "400px" or "auto"
  const link = config?.link;
  const openInNewTab = config?.openInNewTab === true;
  const caption = config?.caption;
  const dataAiHint = config?.dataAiHint; // Get the AI hint if available

  const imageStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: config?.cornerRadius || '0px',
    boxShadow: config?.shadow === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 
               config?.shadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)' : 
               undefined,
    display: 'block', // Good for layout control
    margin: '0.5em auto', // Basic margin for standalone images
  };

  const imageElement = (
    // Using a regular img tag for simplicity with dynamic src and styles.
    // Next/Image requires width/height props as numbers for non-fill, and more setup for remote patterns.
    // For production, consider how to handle user-uploaded images and optimize them.
    <img 
      src={src as string} 
      alt={alt as string} 
      style={imageStyle} 
      data-ai-hint={dataAiHint as string || undefined} 
    />
  );

  const content = link ? (
    <a href={link as string} target={openInNewTab ? '_blank' : '_self'} rel={openInNewTab ? 'noopener noreferrer' : undefined}>
      {imageElement}
    </a>
  ) : (
    imageElement
  );

  return (
    <figure style={{ margin: '0.5em 0' }}>
      {content}
      {caption && <figcaption style={{ textAlign: 'center', fontSize: '0.9em', color: '#555', marginTop: '0.5em' }}>{caption as string}</figcaption>}
    </figure>
  );
};

export default ImageRenderer;
