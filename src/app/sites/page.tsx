
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPublishedSiteDataByHost } from '@/actions/website';
import type { IWebsiteVersionPage } from '@/models/WebsiteVersion';
import ElementRenderer from '@/components/site-renderer/ElementRenderer';

/**
 * This page handles rendering the root ("/") of a user's published site.
 * It is triggered by the middleware for requests to a user's subdomain or custom domain.
 */
export default async function SiteRootPage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // For the root page, the slug is always "/"
  const slug = '/';

  const { website, publishedVersion, navigations, error } = await getPublishedSiteDataByHost(host);

  if (error || !website || !publishedVersion) {
    console.warn(`[SitePage] Site not found or error for host "${host}", slug "${slug}":`, error);
    notFound();
  }

  const currentPage: IWebsiteVersionPage | undefined = publishedVersion.pages.find(p => p.slug === slug);

  if (!currentPage) {
    console.warn(`[SitePage] Homepage not found for slug "${slug}" on host "${host}"`);
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
