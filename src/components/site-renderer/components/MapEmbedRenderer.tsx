
import type { IPageComponent } from '@/models/PageComponent';

interface MapEmbedRendererProps {
    config: IPageComponent['config'];
}

const MapEmbedRenderer: React.FC<MapEmbedRendererProps> = ({ config }) => {
    const embedUrl = config?.embedUrl;
    const height = config?.height || '400px';

    if (!embedUrl) {
        return (
            <div className="my-4 p-4 border border-dashed border-destructive text-destructive bg-destructive/10 rounded-md text-center flex items-center justify-center" style={{ height }}>
                Map Embed: Invalid configuration. Please provide an embed URL in the editor.
            </div>
        );
    }

  return (
    <div className="my-4" style={{ height }}>
        <iframe
            src={embedUrl as string}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Map Embed"
        ></iframe>
    </div>
  );
};

export default MapEmbedRenderer;
