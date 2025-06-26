
import type { IPageComponent } from '@/models/PageComponent';
import NextImage from 'next/image';

interface ImageRendererProps {
  config: IPageComponent['config'];
}

const ImageRenderer: React.FC<ImageRendererProps> = ({ config }) => {
  const src = config?.src || 'https://placehold.co/600x400.png?text=Placeholder';
  const alt = config?.alt || 'Website image';
  // Ensure width and height are numbers, providing a default if not.
  const width = typeof config?.width === 'number' && config.width > 0 ? config.width : 600;
  const height = typeof config?.height === 'number' && config.height > 0 ? config.height : 400;
  const link = config?.link;
  const openInNewTab = config?.openInNewTab === true;
  const caption = config?.caption;
  const dataAiHint = config?.dataAiHint;

  const imageClasses = `
    block 
    my-2 
    mx-auto 
    ${config?.shadow === 'md' ? 'shadow-md' : ''}
    ${config?.shadow === 'lg' ? 'shadow-lg' : ''}
  `;
  
  const imageStyle: React.CSSProperties = {
     borderRadius: config?.cornerRadius || '0.5rem',
  };


  const imageElement = (
    <NextImage
      src={src as string}
      alt={alt as string}
      width={width}
      height={height}
      className={imageClasses}
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
    <figure className="my-2">
      {content}
      {caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{caption as string}</figcaption>}
    </figure>
  );
};

export default ImageRenderer;
