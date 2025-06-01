
"use client";

import { useState } from 'react';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquareDashed, Type, Image as ImageIcon, Square as ButtonIconElement, BarChart2, UploadCloud, Crop, Sparkles, Box, Columns as ColumnsIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch'; // Added for toggles
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added for select inputs

// Define a type for the selected element, including potential properties
interface SelectedElement {
  id: string;
  type: string;
  // Add conceptual properties here as needed for different types
  name?: string; // Example: for a section name
  textContent?: string; // For Heading, Text
  fontSize?: string; // For Heading, Text
  color?: string; // For Heading, Text, Button background
  imageUrl?: string; // For Image
  altText?: string; // For Image
  buttonText?: string; // For Button
  linkUrl?: string; // For Button
  // Section specific
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  fullWidth?: boolean;
  // Columns specific
  columnCount?: number;
  columnGap?: string;
  responsiveLayoutMobile?: 'stack' | '2-col' | 'equal';
}

export default function EditorPage() {
  const [currentDevice, setCurrentDevice] = useState<DeviceType>('desktop');
  const [selectedElement, setSelectedElement] = useState<null | SelectedElement>(null);

  // Function to render specific property fields based on element type
  const renderPropertyFields = () => {
    if (!selectedElement) return null;

    switch (selectedElement.type) {
      case 'Heading':
        return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.name || selectedElement.id}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="textContent" className="text-xs">Text Content</Label>
              <Textarea id="textContent" defaultValue={selectedElement.textContent || ""} placeholder="Enter heading text" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="fontSize" className="text-xs">Font Size (e.g., 2rem, 24px)</Label>
              <Input type="text" id="fontSize" defaultValue={selectedElement.fontSize || ""} placeholder="e.g., 2rem" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="color" className="text-xs">Text Color</Label>
              <Input type="color" id="color" defaultValue={selectedElement.color || "#333333"} className="text-xs h-8 w-full" />
            </div>
             <div className="space-y-2 mt-2">
              <Label htmlFor="headingLevel" className="text-xs">Level (H1-H6)</Label>
              <Select defaultValue="h2">
                <SelectTrigger id="headingLevel" className="w-full text-xs bg-input">
                    <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                    <SelectItem value="h4">H4</SelectItem>
                    <SelectItem value="h5">H5</SelectItem>
                    <SelectItem value="h6">H6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Alignment, spacing, and advanced typography settings would appear here. Changes would reflect live on the canvas.</p>
          </>
        );
      case 'Text':
         return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.name || selectedElement.id}</strong></p>
            <p className="text-xs text-muted-foreground mb-2">
              A WYSIWYG toolbar (Bold, Italic, Underline, Lists, Links, etc.) would appear here or above the text area.
            </p>
            <div className="space-y-2">
              <Label htmlFor="richTextContent" className="text-xs">Content</Label>
              <Textarea 
                id="richTextContent" 
                defaultValue={selectedElement.textContent || ""} 
                placeholder="Enter your rich text content here. You can add multiple paragraphs, format text, and create lists. A full toolbar with formatting options (bold, italic, lists, links etc.) would appear here." 
                rows={8} 
                className="text-xs" 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Font family, size, color, alignment, and line height controls would be available.
              Image insertion within this text block is typically handled by a dedicated Image component or advanced editor plugins.
              Form validation would ensure content meets any constraints (e.g., character limits).
            </p>
          </>
        );
      case 'Image':
        return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.name || selectedElement.id}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-xs">Image Source URL</Label>
              <Input type="url" id="imageUrl" defaultValue={selectedElement.imageUrl || ""} placeholder="https://placehold.co/600x400.png" className="text-xs" />
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 text-xs" disabled>
              <UploadCloud className="mr-2 h-3.5 w-3.5" /> Upload Image (Conceptual)
            </Button>
            <p className="text-xs text-muted-foreground mt-1 text-center">Or drag & drop an image here.</p>
            
            <Separator className="my-3" />

            <div className="space-y-2 mt-2">
              <Label htmlFor="altText" className="text-xs">Alt Text (Accessibility)</Label>
              <Input type="text" id="altText" defaultValue={selectedElement.altText || ""} placeholder="Descriptive text for image" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="imageWidth" className="text-xs">Width (e.g., 100%, 300px)</Label>
              <Input type="text" id="imageWidth" placeholder="e.g., 100%" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="imageLink" className="text-xs">Link URL (Optional)</Label>
              <Input type="url" id="imageLink" placeholder="https://example.com" className="text-xs" />
            </div>

            <Separator className="my-3" />
             <div>
              <h4 className="text-xs font-medium mb-1 text-muted-foreground flex items-center"><Crop className="mr-1.5 h-3.5 w-3.5" /> Basic Editing (Conceptual)</h4>
              <div className="flex gap-2 mt-1">
                <Button variant="outline" size="sm" className="text-xs flex-1" disabled>Crop</Button>
                <Button variant="outline" size="sm" className="text-xs flex-1" disabled>Resize</Button>
                <Button variant="outline" size="sm" className="text-xs flex-1" disabled>Filters</Button>
              </div>
               <p className="text-xs text-muted-foreground mt-2">Advanced image editing tools might open in a modal or separate view.</p>
            </div>

            <Separator className="my-3" />
            <div className="flex items-center text-xs text-muted-foreground">
              <Sparkles className="mr-1.5 h-3.5 w-3.5 text-green-500" />
              <span>Images are automatically optimized for performance. Supports JPG, PNG, WebP, GIF.</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Controls for height, alignment, border-radius, shadow, and lightbox options would also be here.</p>
          </>
        );
      case 'Button':
        return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.name || selectedElement.id}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="buttonText" className="text-xs">Button Text</Label>
              <Input type="text" id="buttonText" defaultValue={selectedElement.buttonText || ""} placeholder="Click Me" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="linkUrl" className="text-xs">Link URL</Label>
              <Input type="url" id="linkUrl" defaultValue={selectedElement.linkUrl || ""} placeholder="/contact" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="buttonBgColor" className="text-xs">Background Color</Label>
              <Input type="color" id="buttonBgColor" defaultValue={selectedElement.color || "hsl(var(--primary))"} className="text-xs h-8 w-full" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="buttonTextColor" className="text-xs">Text Color</Label>
              <Input type="color" id="buttonTextColor" defaultValue="#FFFFFF" className="text-xs h-8 w-full" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Options for style (solid, outline), size, hover effects, icons, and padding/margin would be available here.</p>
          </>
        );
      case 'Section':
        return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.name || selectedElement.id}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="sectionBgColor" className="text-xs">Background Color</Label>
              <Input type="color" id="sectionBgColor" defaultValue={selectedElement.backgroundColor || "#FFFFFF"} className="text-xs h-8 w-full" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="sectionPaddingTop" className="text-xs">Padding Top (e.g., 20px, 2rem)</Label>
              <Input type="text" id="sectionPaddingTop" defaultValue={selectedElement.paddingTop || "20px"} placeholder="e.g., 20px" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="sectionPaddingBottom" className="text-xs">Padding Bottom (e.g., 20px, 2rem)</Label>
              <Input type="text" id="sectionPaddingBottom" defaultValue={selectedElement.paddingBottom || "20px"} placeholder="e.g., 20px" className="text-xs" />
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <Switch id="sectionFullWidth" defaultChecked={selectedElement.fullWidth} />
              <Label htmlFor="sectionFullWidth" className="text-xs">Full Width Section</Label>
            </div>
             <div className="space-y-2 mt-2">
              <Label htmlFor="sectionMinHeight" className="text-xs">Min Height (e.g., 300px, auto)</Label>
              <Input type="text" id="sectionMinHeight" placeholder="e.g., 300px" className="text-xs" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Options for background image, content alignment, width constraints, and advanced spacing would appear here.</p>
          </>
        );
        case 'Columns':
        return (
          <>
            <p className="text-xs text-muted-foreground mb-3">Editing: <strong>{selectedElement.name || selectedElement.id}</strong></p>
            <div className="space-y-2">
              <Label htmlFor="columnCount" className="text-xs">Number of Columns</Label>
              <Select defaultValue={selectedElement.columnCount?.toString() || "2"}>
                <SelectTrigger id="columnCount" className="w-full text-xs bg-input">
                    <SelectValue placeholder="Select columns" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2 mt-2">
              <Label htmlFor="columnGap" className="text-xs">Gap Between Columns (e.g., 16px, 1rem)</Label>
              <Input type="text" id="columnGap" defaultValue={selectedElement.columnGap || "16px"} placeholder="e.g., 16px" className="text-xs" />
            </div>
            <div className="space-y-2 mt-2">
              <Label htmlFor="responsiveLayoutMobile" className="text-xs">Mobile Layout</Label>
               <Select defaultValue={selectedElement.responsiveLayoutMobile || "stack"}>
                <SelectTrigger id="responsiveLayoutMobile" className="w-full text-xs bg-input">
                    <SelectValue placeholder="Select mobile layout" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="stack">Stack Columns</SelectItem>
                    <SelectItem value="2-col">Force 2 Columns</SelectItem>
                    <SelectItem value="equal">Keep Equal Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Controls for individual column widths (e.g., 30%/70%), vertical alignment per column, and different responsive behaviors for tablet/desktop would be here.
              Each column would act as a drop target for other components.
            </p>
          </>
        );
      default:
        return (
          <>
            <p className="text-sm text-muted-foreground mb-2">Editing properties for: <strong>{selectedElement.type} ({selectedElement.id})</strong></p>
            <p className="text-xs text-muted-foreground">No specific property fields defined for this conceptual element type yet. General properties (e.g., margins, padding, visibility, advanced styling like custom CSS classes) could appear here.</p>
          </>
        );
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'Heading': return <Type className="w-5 h-5 mr-2 text-primary" />;
      case 'Text': return <Type className="w-5 h-5 mr-2 text-primary" />;
      case 'Image': return <ImageIcon className="w-5 h-5 mr-2 text-primary" />;
      case 'Button': return <ButtonIconElement className="w-5 h-5 mr-2 text-primary" />;
      case 'Section': return <Box className="w-5 h-5 mr-2 text-primary" />;
      case 'Columns': return <ColumnsIcon className="w-5 h-5 mr-2 text-primary" />;
      default: return <MousePointerSquareDashed className="w-5 h-5 mr-2 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <AppHeader currentDevice={currentDevice} onDeviceChange={setCurrentDevice} />
      <div className="flex flex-1 overflow-hidden">
        <ComponentLibrarySidebar />
        <main className="flex-1 flex flex-col p-1 md:p-4 overflow-hidden bg-muted/30">
          <CanvasEditor devicePreview={currentDevice} />
        </main>
        <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col overflow-y-auto">
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="font-headline text-lg flex items-center">
                {selectedElement ? (
                  <>
                    {getElementIcon(selectedElement.type)}
                    {selectedElement.type} Properties
                  </>
                ) : (
                  <>
                    <Settings className="w-5 h-5 mr-2 text-primary" />
                    Page Settings
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedElement ? (
                <div className="space-y-4"> 
                  {renderPropertyFields()}
                </div>
              ) : (
                <>
                <p className="text-sm text-muted-foreground">
                  No element selected. Click an element on the canvas or select one from the Page Outline (conceptual) to edit its properties.
                </p>
                <div className="mt-4 space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="pageTitle" className="text-xs">Page Title (SEO)</Label>
                        <Input type="text" id="pageTitle" placeholder="Enter page title" className="text-xs" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pageSlug" className="text-xs">Page Slug (URL)</Label>
                        <Input type="text" id="pageSlug" placeholder="/my-awesome-page" className="text-xs" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pageDescription" className="text-xs">Page Description (SEO)</Label>
                        <Textarea id="pageDescription" placeholder="Enter meta description for SEO" className="text-xs" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pageBgColor" className="text-xs">Page Background Color</Label>
                        <Input type="color" id="pageBgColor" defaultValue="#FFFFFF" className="text-xs h-8 w-full" />
                    </div>

                    <Separator className="my-4" />
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2 text-muted-foreground" /> Analytics
                      </h4>
                       <div className="space-y-2">
                        <Label htmlFor="analyticsTrackingId" className="text-xs">Tracking ID (e.g., Google Analytics G-XXXX)</Label>
                        <Input type="text" id="analyticsTrackingId" placeholder="Enter your tracking ID" className="text-xs" />
                         <p className="text-xs text-muted-foreground mt-1">This ID would be used by the publishing system to inject analytics scripts (e.g., gtag.js) into your site.</p>
                      </div>
                    </div>
                     <p className="text-xs text-muted-foreground mt-4">Other page settings like custom CSS, header/footer scripts, and global font choices would go here.</p>
                </div>
                </>
              )}
              
              <div className="mt-6 border-t pt-4">
                 <p className="text-xs text-muted-foreground mb-2">Conceptual Element Selection:</p>
                {selectedElement ? (
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setSelectedElement(null)}>
                        Deselect (Show Page Settings)
                    </Button>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'heading-123', type: 'Heading', name: 'Hero Title', textContent: 'My Awesome Title', fontSize: '2.5rem', color: '#222222'})}>
                            Select Sample Heading
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'img-456', type: 'Image', name: 'Banner Image', imageUrl: 'https://placehold.co/600x400.png', altText: 'Placeholder Banner'})}>
                            Select Sample Image
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'btn-789', type: 'Button', name: 'CTA Button', buttonText: 'Learn More', linkUrl: '/about', color: 'hsl(var(--primary))'})}>
                            Select Sample Button
                        </Button>
                         <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'text-012', type: 'Text', name: 'Intro Paragraph', textContent: 'This is a sample rich text block.'})}>
                            Select Sample Text Block
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'section-ABC', type: 'Section', name: 'Hero Section', backgroundColor: '#F0F8FF', paddingTop: '40px', paddingBottom: '40px', fullWidth: true})}>
                            Select Sample Section
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'cols-DEF', type: 'Columns', name: 'Feature Columns', columnCount: 3, columnGap: '24px', responsiveLayoutMobile: 'stack'})}>
                            Select Sample Columns
                        </Button>
                    </div>
                )}
                 <p className="text-xs text-muted-foreground mt-3">Undo/Redo actions would be available in the main toolbar.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

