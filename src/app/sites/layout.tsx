
import type { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import { getPublishedSiteDataByHost } from '@/actions/website';
import '@/app/globals.css'; // Import the global stylesheet

type Props = {
  params: { siteSlug?: string[] };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const slug = params.siteSlug && params.siteSlug.length > 0 ? `/${params.siteSlug.join('/')}` : '/';

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
    title: currentPage?.seoTitle || `${currentPage?.name || 'Home'} - ${siteName}`,
    description: currentPage?.seoDescription || website.description || 'A site built with NCBX Canvas.',
  };
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const { publishedVersion } = await getPublishedSiteDataByHost(host);

  const fontBody = publishedVersion?.globalSettings?.fontFamily || 'Inter';
  const fontHeadline = publishedVersion?.globalSettings?.fontHeadline || 'Poppins';
  
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontBody.replace(/ /g, '+')}:wght@400;500;600;700&family=${fontHeadline.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --font-body: "${fontBody}";
            --font-headline: "${fontHeadline}";
          }
        `}} />
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
