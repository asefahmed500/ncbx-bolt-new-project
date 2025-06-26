
import type { IPageComponent } from '@/models/PageComponent';
import Image from 'next/image';

interface BlogPostItem {
  title: string;
  excerpt: string;
  imageUrl?: string;
  link: string;
  date: string;
  dataAiHint?: string;
}

interface BlogPostsRendererProps {
  config: IPageComponent['config'];
}

const BlogPostsRenderer: React.FC<BlogPostsRendererProps> = ({ config }) => {
  const sectionTitle = config?.title || 'Latest Articles';
  const posts: BlogPostItem[] = config?.posts || [
    { title: "Blog Post 1", excerpt: "Exciting news and updates coming soon...", imageUrl: "https://placehold.co/400x250.png", link: "#", date: "June 1, 2024", dataAiHint:"technology article"},
    { title: "Blog Post 2", excerpt: "Discover our new features in this post.", imageUrl: "https://placehold.co/400x250.png", link: "#", date: "May 28, 2024", dataAiHint:"business strategy"},
    { title: "Blog Post 3", excerpt: "A deep dive into industry trends for this year.", imageUrl: "https://placehold.co/400x250.png", link: "#", date: "May 15, 2024", dataAiHint:"data analysis"},
  ];
  const showFeaturedImage = config?.showFeaturedImage !== undefined ? config.showFeaturedImage : true;

  return (
    <section className="py-12 md:py-20 bg-muted/30 text-foreground">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold font-headline text-center mb-12">{sectionTitle}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <a key={index} href={post.link} className="block bg-card rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
              {showFeaturedImage && post.imageUrl && (
                <div className="relative w-full h-48">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={post.dataAiHint || "blog article"}
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold font-headline mb-2 text-card-foreground group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{post.excerpt}</p>
                <p className="text-xs text-muted-foreground">{post.date}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPostsRenderer;
