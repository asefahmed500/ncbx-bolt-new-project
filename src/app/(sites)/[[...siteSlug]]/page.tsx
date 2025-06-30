import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPublishedSiteDataByHost } from '@/actions/website';
import type { IWebsiteVersionPage } from '@/models/WebsiteVersion';
import ElementRenderer from '@/components/site-renderer/ElementRenderer';

// This becomes an optional catch-all route
type SitePageProps = {
  params: { siteSlug?: string[] }; // siteSlug is now optional
};

export default async function SitePage({ params }: SitePageProps) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  // If siteSlug exists, join it to form a path. Otherwise, it's the root page ("/").
  const slug = params.siteSlug && params.siteSlug.length > 0 ? `/${params.siteSlug.join('/')}` : '/';

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

  // Apply global styles or settings here if needed, e.g., background color
  // const siteBackgroundColor = publishedVersion.globalSettings?.backgroundColor || '#FFFFFF';

  return (
    <div className="mx-auto" /* style={{ backgroundColor: siteBackgroundColor }} */ >
      {/* Basic structure, real styling would come from component configs & global CSS */}
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
