
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
import DividerRenderer from './components/DividerRenderer';
import ColumnsRenderer from './components/ColumnsRenderer';
import SectionRenderer from './components/SectionRenderer';
import FormRenderer from './components/FormRenderer';
import InputRenderer from './components/InputRenderer';
import TextareaFieldRenderer from './components/TextareaFieldRenderer';
import MapEmbedRenderer from './components/MapEmbedRenderer';
import CustomCodeRenderer from './components/CustomCodeRenderer';
import SpacerRenderer from './components/SpacerRenderer';
import TabsRenderer from './components/TabsRenderer';
import SliderRenderer from './components/SliderRenderer';
import LoginSignupRenderer from './components/LoginSignupRenderer';
import LockedContentRenderer from './components/LockedContentRenderer';


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
    case 'divider':
        return <DividerRenderer config={element.config} />;
    case 'section':
        return <SectionRenderer config={element.config} />;
    case 'columns':
        return <ColumnsRenderer config={element.config} />;
    case 'form':
        return <FormRenderer config={element.config} />;
    case 'input':
        return <InputRenderer config={element.config} />;
    case 'textarea_field':
        return <TextareaFieldRenderer config={element.config} />;
    case 'map_embed':
        return <MapEmbedRenderer config={element.config} />;
    case 'customCode':
        return <CustomCodeRenderer config={element.config} />;
    case 'spacer':
        return <SpacerRenderer config={element.config} />;
    case 'tabs':
        return <TabsRenderer config={element.config} />;
    case 'slider':
        return <SliderRenderer config={element.config} />;
    case 'login_signup':
        return <LoginSignupRenderer config={element.config} />;
    case 'locked_content':
        return <LockedContentRenderer config={element.config} />;
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
