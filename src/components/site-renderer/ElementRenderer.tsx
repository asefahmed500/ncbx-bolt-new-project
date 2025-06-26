
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
import VideoEmbedRenderer from './components/VideoEmbedRenderer';
import MapEmbedRenderer from './components/MapEmbedRenderer';
import CustomCodeRenderer from './components/CustomCodeRenderer';
import DividerRenderer from './components/DividerRenderer';
import ColumnsRenderer from './components/ColumnsRenderer';
import SectionRenderer from './components/SectionRenderer';
import SpacerRenderer from './components/SpacerRenderer';
import TabsRenderer from './components/TabsRenderer';
import SliderRenderer from './components/SliderRenderer';
import LoginSignupRenderer from './components/LoginSignupRenderer';
import LockedContentRenderer from './components/LockedContentRenderer';
import CallToActionRenderer from './components/CallToActionRenderer';
import StatsRenderer from './components/StatsRenderer';
import TeamRenderer from './components/TeamRenderer';
import NewsletterSignupRenderer from './components/NewsletterSignupRenderer';
import BlogPostsRenderer from './components/BlogPostsRenderer';
import ServicesListRenderer from './components/ServicesListRenderer';
import AboutSectionRenderer from './components/AboutSectionRenderer';


interface ElementRendererProps {
  element: IPageComponent;
}

const ElementRenderer: React.FC<ElementRendererProps> = ({ element }) => {
  if (!element || !element.type) {
    return (
      <div className="my-2 p-3 border border-dashed border-destructive/50 bg-destructive/10 rounded">
        <p className="text-xs text-destructive font-semibold">
          Error: Invalid Component Data
        </p>
        <p className="text-xs text-destructive/80 mt-1">
          The component data is missing or malformed.
        </p>
      </div>
    );
  }
  
  const componentProps = {
    config: element.config,
  };

  switch (element.type) {
    case 'heading':
      return <HeadingRenderer {...componentProps} />;
    case 'text':
      return <TextRenderer {...componentProps} />;
    case 'image':
      return <ImageRenderer {...componentProps} />;
    case 'button':
      return <ButtonRenderer {...componentProps} />;
    case 'navbar':
      return <NavbarRenderer {...componentProps} />;
    case 'hero':
      return <HeroRenderer {...componentProps} />;
    case 'card_section':
      return <CardSectionRenderer {...componentProps} />;
    case 'footer':
      return <FooterRenderer {...componentProps} />;
    case 'features':
      return <FeaturesRenderer {...componentProps} />;
    case 'testimonials':
      return <TestimonialsRenderer {...componentProps} />;
    case 'pricing_table':
      return <PricingTableRenderer {...componentProps} />;
    case 'contact_form':
      return <ContactFormRenderer {...componentProps} />;
    case 'faq':
      return <FAQRenderer {...componentProps} />;
    case 'video_embed':
      return <VideoEmbedRenderer {...componentProps} />;
    case 'map_embed':
        return <MapEmbedRenderer {...componentProps} />;
    case 'customCode':
        return <CustomCodeRenderer {...componentProps} />;
    case 'divider':
        return <DividerRenderer {...componentProps} />;
    case 'section':
        return <SectionRenderer {...componentProps} />;
    case 'columns':
        return <ColumnsRenderer {...componentProps} />;
    case 'spacer':
        return <SpacerRenderer {...componentProps} />;
    case 'tabs':
        return <TabsRenderer {...componentProps} />;
    case 'slider':
        return <SliderRenderer {...componentProps} />;
    case 'login_signup':
        return <LoginSignupRenderer {...componentProps} />;
    case 'locked_content':
        return <LockedContentRenderer {...componentProps} />;
    case 'call_to_action':
      return <CallToActionRenderer {...componentProps} />;
    case 'stats':
      return <StatsRenderer {...componentProps} />;
    case 'team':
      return <TeamRenderer {...componentProps} />;
    case 'newsletter_signup':
      return <NewsletterSignupRenderer {...componentProps} />;
    case 'blog_posts':
      return <BlogPostsRenderer {...componentProps} />;
    case 'services_list':
      return <ServicesListRenderer {...componentProps} />;
    case 'about_section':
      return <AboutSectionRenderer {...componentProps} />;
    default:
      return (
        <div className="my-2 p-3 border border-dashed border-destructive/50 bg-destructive/10 rounded">
          <p className="text-xs text-destructive font-semibold">
            Unknown Component: <strong>{element.type}</strong>
          </p>
          <p className="text-xs text-destructive/80 mt-1">
            This component type does not have a renderer. Please check the component registry and ensure a corresponding renderer exists.
          </p>
        </div>
      );
  }
};

export default ElementRenderer;

