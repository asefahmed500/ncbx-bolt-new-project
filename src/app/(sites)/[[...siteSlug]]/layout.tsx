
import type { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import { getPublishedSiteDataByHost } from '@/actions/website';
// import '@/app/globals.css'; // Potentially a different global CSS for rendered sites

type Props = {
  params: { siteSlug: string[] };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const host = headers().get('host') || '';
  const slug = params.siteSlug ? `/${params.siteSlug.join('/')}` : '/';

  const { website, publishedVersion, error } = await getPublishedSiteDataByHost(host);

  if (error || !website || !publishedVersion) {
    return {
      title: 'Site Not Found',
      description: 'The site you are looking for could not be found.',
    };
  }

  const currentPage = publishedVersion.pages.find(p => p.slug === slug);
  const siteName = publishedVersion.globalSettings?.siteName || website.name;

  return {
    title: currentPage?.seoTitle || `${currentPage?.name || 'Page'} - ${siteName}`,
    description: currentPage?.seoDescription || website.description || 'A site built with NCBX Canvas.',
    // You can add more metadata here, like openGraph, favicons (from globalSettings.faviconUrl)
    //alternates: {
    //  canonical: `https://${host}${slug}`,
    //},
  };
}

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon link can be dynamically set here based on globalSettings.faviconUrl */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
         {/* Minimal global styles for rendered sites, or link to a site-specific stylesheet */}
        <style>{`
          body { margin: 0; font-family: 'Inter', sans-serif; line-height: 1.6; background-color: #fff; color: #333; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', sans-serif; margin-top: 1.5em; margin-bottom: 0.5em; }
          img { max-width: 100%; height: auto; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .container { max-width: 1100px; margin-left: auto; margin-right: auto; padding-left: 15px; padding-right: 15px; }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
