
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPublishedSiteDataByHost } from '@/actions/website';
import type { IWebsiteVersionPage } from '@/models/WebsiteVersion';
import ElementRenderer from '@/components/site-renderer/ElementRenderer';

/**
 * This is the catch-all route that handles rendering ALL pages for a user's site.
 * It's served from the /sites/ directory, but middleware rewrites user domains to it.
 * - yoursite.com/ -> params.siteSlug will be undefined
 * - yoursite.com/about -> params.siteSlug will be ['about']
 * - yoursite.com/products/item1 -> params.siteSlug will be ['products', 'item1']
 */
type SitePageProps = {
  params: { siteSlug?: string[] };
};

export default async function SitePage({ params }: SitePageProps) {
  const headersList = headers();
  // Vercel might add the port, so we remove it for consistent matching.
  const host = headersList.get('host')?.split(':')[0] || '';

  // Construct the slug from the params.
  // If params.siteSlug is undefined (root page), slug is '/'. Otherwise, join the parts.
  const slug = params.siteSlug ? `/${params.siteSlug.join('/')}` : '/';

  const { website, publishedVersion, navigations, error } = await getPublishedSiteDataByHost(host);

  if (error || !website || !publishedVersion) {
    console.warn(`[SitePage] Site not found or error for host "${host}", slug "${slug}":`, error);
    notFound();
  }

  const currentPage: IWebsiteVersionPage | undefined = publishedVersion.pages.find(p => p.slug === slug);

  if (!currentPage) {
    console.warn(`[SitePage] Page not found for slug "${slug}" on host "${host}"`);
    notFound();
  }

  return (
    <div className="mx-auto">
      {currentPage.elements && currentPage.elements.length > 0 ? (
        currentPage.elements.sort((a, b) => a.order - b.order).map((element) => (
          <ElementRenderer key={element._id as string} element={element} allNavigations={navigations} />
        ))
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">This page is empty.</p>
          <p className="text-sm text-muted-foreground">Edit this site to add content.</p>
        </div>
      )}
    </div>
  );
}
