"use client";

import type { DeviceType } from './app-header'; // Assuming DeviceType is exported from app-header

interface CanvasEditorProps {
  devicePreview: DeviceType;
}

export function CanvasEditor({ devicePreview }: CanvasEditorProps) {
  const getCanvasWidth = () => {
    switch (devicePreview) {
      case 'mobile':
        return '375px'; // Common mobile width
      case 'tablet':
        return '768px'; // Common tablet width
      case 'desktop':
      default:
        return '100%'; // Full width for desktop
    }
  };

  return (
    <div className="flex-1 bg-muted/50 p-6 rounded-lg shadow-inner flex justify-center items-start overflow-auto">
      <div 
        className="bg-background shadow-lg transition-all duration-300 ease-in-out mx-auto"
        style={{ 
          width: getCanvasWidth(), 
          height: devicePreview === 'desktop' ? 'calc(100% - 2rem)' : '812px', // Example height for mobile/tablet
          minHeight: '400px',
          border: '1px dashed hsl(var(--border))',
          padding: '20px',
          boxSizing: 'border-box',
          position: 'relative', // For potential absolute positioned elements within
        }}
        aria-label={`Website canvas preview for ${devicePreview}`}
      >
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p className="text-lg font-medium">Canvas Editor</p>
          <p className="text-sm">Drag components here to build your website.</p>
          <p className="text-xs mt-2">(Current view: {devicePreview})</p>
        </div>
      </div>
    </div>
  );
}
