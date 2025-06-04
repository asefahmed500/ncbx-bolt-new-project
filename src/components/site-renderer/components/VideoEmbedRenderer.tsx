import type { IPageComponent } from '@/models/PageComponent';

interface VideoEmbedRendererProps {
  config: IPageComponent['config'];
}

const VideoEmbedRenderer: React.FC<VideoEmbedRendererProps> = ({ config }) => {
  const provider = config?.provider || 'youtube'; // 'youtube', 'vimeo'
  const videoId = config?.url; // For YouTube, this is the video ID. For Vimeo, the ID.
  const aspectRatio = config?.aspectRatio || '16:9'; // e.g., '16:9', '4:3'
  const autoplay = config?.autoplay || false;
  const loop = config?.loop || false;
  const controls = config?.controls !== undefined ? config.controls : true;

  let embedUrl = '';
  if (provider === 'youtube' && videoId) {
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&controls=${controls ? 1 : 0}${loop ? '&playlist='+videoId : ''}`;
  } else if (provider === 'vimeo' && videoId) {
    embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&controls=${controls ? 1 : 0}`;
  }

  const [w, h] = aspectRatio.split(':').map(Number);
  const paddingTop = (h / w) * 100;

  if (!videoId) {
    return (
      <div className="my-4 p-4 border border-dashed border-destructive text-destructive bg-destructive/10 rounded-md text-center">
        Video Embed: Invalid configuration. Please provide a Video ID/URL.
      </div>
    );
  }

  return (
    <section className="my-4 md:my-6">
      <div 
        className="relative w-full bg-black rounded-lg shadow-lg overflow-hidden"
        style={{ paddingTop: `${paddingTop}%` }}
      >
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={`Embedded video from ${provider}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
};

export default VideoEmbedRenderer;
