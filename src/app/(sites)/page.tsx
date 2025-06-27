
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPublishedSiteDataByHost } from '@/actions/website';
import type { IWebsiteVersionPage } from '@/models/WebsiteVersion';
import ElementRenderer from '@/components/site-renderer/ElementRenderer';

// This page handles the root slug "/" for sites identified by hostname.

export default async function SiteRootPage() {
  const headersList = headers();
  const host = headersList.get('host') || '';
  const slug = '/'; // This page specifically handles the root

  const { website, publishedVersion, navigations, error } = await getPublishedSiteDataByHost(host);

  if (error || !website || !publishedVersion) {
    console.warn(`[SiteRootPage] Site not found or error for host "${host}":`, error);
    // This page is intended for user sites. If getPublishedSiteDataByHost fails,
    // it means no published site is configured for this specific hostname.
    // The main application's root (src/app/page.tsx) handles the app's own domain.
    notFound();
  }

  const currentPage: IWebsiteVersionPage | undefined = publishedVersion.pages.find(p => p.slug === slug);

  if (!currentPage) {
    // This case means a site exists for the host, but it has no "homepage" (a page with slug "/")
    console.warn(`[SiteRootPage] Homepage (slug "/") not found for host "${host}" in published version.`);
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
