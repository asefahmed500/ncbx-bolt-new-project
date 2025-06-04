// @ts-nocheck
"use client";

import type { IPageComponent } from '@/models/PageComponent';
import HeadingRenderer from './components/HeadingRenderer';
import TextRenderer from './components/TextRenderer';
import ImageRenderer from './components/ImageRenderer';
import ButtonRenderer from './components/ButtonRenderer';
import NavbarRenderer from './components/NavbarRenderer';
import HeroRenderer from './components/HeroRenderer';
import CardSectionRenderer from './components/CardSectionRenderer';
import FooterRenderer from './components/FooterRenderer';
import FeaturesRenderer from './components/FeaturesRenderer';
import TestimonialsRenderer from './components/TestimonialsRenderer';
import PricingTableRenderer from './components/PricingTableRenderer';
import ContactFormRenderer from './components/ContactFormRenderer';
import FAQRenderer from './components/FAQRenderer';
import GalleryRenderer from './components/GalleryRenderer';
import StatsRenderer from './components/StatsRenderer';
import CallToActionRenderer from './components/CallToActionRenderer';
import TeamRenderer from './components/TeamRenderer';
import NewsletterSignupRenderer from './components/NewsletterSignupRenderer';
import VideoEmbedRenderer from './components/VideoEmbedRenderer';
import BlogPostsRenderer from './components/BlogPostsRenderer';
import ServicesListRenderer from './components/ServicesListRenderer';
import AboutSectionRenderer from './components/AboutSectionRenderer';


interface ElementRendererProps {
  element: IPageComponent;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ element }) => {
  switch (element.type) {
    case 'heading':
      return <HeadingRenderer config={element.config} />;
    case 'text':
      return <TextRenderer config={element.config} />;
    case 'image':
      return <ImageRenderer config={element.config} />;
    case 'button':
      return <ButtonRenderer config={element.config} />;
    case 'navbar':
      return <NavbarRenderer config={element.config} />;
    case 'hero':
      return <HeroRenderer config={element.config} />;
    case 'card_section':
      return <CardSectionRenderer config={element.config} />;
    case 'footer':
      return <FooterRenderer config={element.config} />;
    case 'features':
      return <FeaturesRenderer config={element.config} />;
    case 'testimonials':
      return <TestimonialsRenderer config={element.config} />;
    case 'pricing_table':
      return <PricingTableRenderer config={element.config} />;
    case 'contact_form':
      return <ContactFormRenderer config={element.config} />;
    case 'faq':
      return <FAQRenderer config={element.config} />;
    case 'gallery':
      return <GalleryRenderer config={element.config} />;
    case 'stats':
      return <StatsRenderer config={element.config} />;
    case 'call_to_action':
      return <CallToActionRenderer config={element.config} />;
    case 'team':
      return <TeamRenderer config={element.config} />;
    case 'newsletter_signup':
      return <NewsletterSignupRenderer config={element.config} />;
    case 'video_embed':
      return <VideoEmbedRenderer config={element.config} />;
    case 'blog_posts':
      return <BlogPostsRenderer config={element.config} />;
    case 'services_list':
      return <ServicesListRenderer config={element.config} />;
    case 'about_section':
      return <AboutSectionRenderer config={element.config} />;
    // Placeholder for components like section, columns, divider, customCode etc.
    // case 'section':
    //   return <SectionRenderer config={element.config} elements={element.config?.children || []} />; 
    // case 'columns':
    //   return <ColumnsRenderer config={element.config} columnsData={element.config?.columns || []} />; 
    default:
      return (
        <div className="my-2 p-3 border border-dashed border-neutral-300 bg-neutral-50 rounded">
          <p className="text-xs text-neutral-500">
            Render for: <strong>{element.type}</strong> (Not fully implemented)
          </p>
          <pre className="mt-1 text-xs bg-neutral-100 p-1 overflow-auto max-h-32">
            {JSON.stringify(element.config, null, 2)}
          </pre>
        </div>
      );
  }
};

export default ElementRenderer;
