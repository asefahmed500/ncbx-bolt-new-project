
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import HeadingRenderer from './components/HeadingRenderer';
import TextRenderer from './components/TextRenderer';
import ImageRenderer from './components/ImageRenderer';
import ButtonRenderer from './components/ButtonRenderer';
// Import other renderers as they are created
// import VideoRenderer from './components/VideoRenderer';
// import SectionRenderer from './components/SectionRenderer';
// import ColumnsRenderer from './components/ColumnsRenderer';
// etc.

interface ElementRendererProps {
  element: IPageComponent;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ element }) => {
  switch (element.type) {
    case 'heading':
      return <HeadingRenderer config={element.config} />;
    case 'text':
      return <TextRenderer config={element.config} />;
    case 'image':
      return <ImageRenderer config={element.config} />;
    case 'button':
      return <ButtonRenderer config={element.config} />;
    // case 'video':
    //   return <VideoRenderer config={element.config} />;
    // case 'section':
    //   return <SectionRenderer config={element.config} elements={element.config?.children || []} />; // Assuming sections can have children
    // case 'columns':
    //   return <ColumnsRenderer config={element.config} columnsData={element.config?.columns || []} />; // Assuming columns config
    default:
      return (
        <div className="my-2 p-3 border border-dashed border-neutral-300 bg-neutral-50 rounded">
          <p className="text-xs text-neutral-500">
            Unsupported element type: <strong>{element.type}</strong>
          </p>
          <pre className="mt-1 text-xs bg-neutral-100 p-1 overflow-auto">
            {JSON.stringify(element.config, null, 2)}
          </pre>
        </div>
      );
  }
};

export default ElementRenderer;
