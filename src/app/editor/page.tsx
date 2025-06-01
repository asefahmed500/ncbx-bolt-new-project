
"use client";

import { useState } from 'react';
import { AppHeader, type DeviceType } from '@/components/editor/app-header';
import { ComponentLibrarySidebar } from '@/components/editor/component-library-sidebar';
import { CanvasEditor } from '@/components/editor/canvas-editor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, MousePointerSquare, Type, Image as ImageIcon, Square as ButtonIcon, BarChart2 } from 'lucide-react'; // Added BarChart2 icon
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator'; // Import Separator

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
            <div className="space-y-1">
              <Label htmlFor="textContent" className="text-xs">Text Content</Label>
              <Textarea id="textContent" placeholder={selectedElement.textContent || "Enter heading text"} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fontSize" className="text-xs">Font Size (e.g., 24px, 1.5rem)</Label>
              <Input type="text" id="fontSize" placeholder={selectedElement.fontSize || "e.g., 2rem"} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="color" className="text-xs">Color (e.g., #FF0000)</Label>
              <Input type="text" id="color" placeholder={selectedElement.color || "#333333"} className="text-xs" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">More specific heading properties (level H1-H6, alignment, etc.) would appear here.</p>
          </>
        );
      case 'Text': // Rich Text Block
         return (
          <>
            <div className="space-y-1">
              <Label htmlFor="richTextContent" className="text-xs">Content</Label>
              <Textarea id="richTextContent" placeholder="Enter rich text content..." rows={5} className="text-xs" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">A mini rich text editor (WYSIWYG) for formatting (bold, italic, lists, links) would be embedded here.</p>
          </>
        );
      case 'Image':
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="imageUrl" className="text-xs">Image URL</Label>
              <Input type="text" id="imageUrl" placeholder={selectedElement.imageUrl || "https://placehold.co/600x400.png"} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="altText" className="text-xs">Alt Text</Label>
              <Input type="text" id="altText" placeholder={selectedElement.altText || "Descriptive text for image"} className="text-xs" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Controls for width, height, alignment, link, lightbox options would be here.</p>
          </>
        );
      case 'Button':
        return (
          <>
            <div className="space-y-1">
              <Label htmlFor="buttonText" className="text-xs">Button Text</Label>
              <Input type="text" id="buttonText" placeholder={selectedElement.buttonText || "Click Me"} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="linkUrl" className="text-xs">Link URL</Label>
              <Input type="text" id="linkUrl" placeholder={selectedElement.linkUrl || "/contact"} className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="buttonColor" className="text-xs">Background Color</Label>
              <Input type="text" id="buttonColor" placeholder={selectedElement.color || "hsl(var(--primary))"} className="text-xs" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Style (solid, outline), size, text color, hover effects, icon options would be here.</p>
          </>
        );
      default:
        return (
          <>
            <p className="text-sm text-muted-foreground mb-2">Editing properties for: <strong>{selectedElement.type} ({selectedElement.id})</strong></p>
            <p className="text-xs text-muted-foreground">No specific property fields defined for this conceptual element type yet. General properties (e.g., margins, padding, visibility) could appear here.</p>
          </>
        );
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'Heading': return <Type className="w-5 h-5 mr-2 text-primary" />;
      case 'Text': return <Type className="w-5 h-5 mr-2 text-primary" />;
      case 'Image': return <ImageIcon className="w-5 h-5 mr-2 text-primary" />;
      case 'Button': return <ButtonIcon className="w-5 h-5 mr-2 text-primary" />;
      default: return <MousePointerSquare className="w-5 h-5 mr-2 text-primary" />;
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
        <aside className="w-80 bg-card border-l border-border p-4 shadow-sm flex flex-col"> {/* Increased width */}
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
                <div className="space-y-3">
                  {renderPropertyFields()}
                </div>
              ) : (
                <>
                <p className="text-sm text-muted-foreground">
                  No element selected. Showing page-level settings.
                </p>
                <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="pageTitle" className="text-xs">Page Title (SEO)</Label>
                        <Input type="text" id="pageTitle" placeholder="Enter page title" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="pageDescription" className="text-xs">Page Description (SEO)</Label>
                        <Textarea id="pageDescription" placeholder="Enter meta description for SEO" className="text-xs" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="pageBgColor" className="text-xs">Page Background Color</Label>
                        <Input type="text" id="pageBgColor" placeholder="#FFFFFF" className="text-xs" />
                    </div>

                    <Separator className="my-3" />
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <BarChart2 className="w-4 h-4 mr-2 text-muted-foreground" /> Analytics
                      </h4>
                       <div className="space-y-1">
                        <Label htmlFor="analyticsTrackingId" className="text-xs">Tracking ID (e.g., Google Analytics G-XXXX)</Label>
                        <Input type="text" id="analyticsTrackingId" placeholder="Enter your tracking ID" className="text-xs" />
                         <p className="text-xs text-muted-foreground mt-1">This ID would be used by the publishing system to inject analytics scripts (e.g., gtag.js) into your site.</p>
                      </div>
                    </div>

                     <p className="text-xs text-muted-foreground mt-4">Other page settings like custom CSS, header/footer scripts would go here.</p>
                </div>
                </>
              )}
              
              <div className="mt-6 border-t pt-4">
                 <p className="text-xs text-muted-foreground mb-2">Conceptual Actions:</p>
                {selectedElement ? (
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setSelectedElement(null)}>
                        Deselect (Show Page Settings)
                    </Button>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'heading-123', type: 'Heading', textContent: 'My Awesome Title'})}>
                            Select Sample Heading
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'img-456', type: 'Image', imageUrl: 'https://placehold.co/300x200.png'})}>
                            Select Sample Image
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'btn-789', type: 'Button', buttonText: 'Learn More'})}>
                            Select Sample Button
                        </Button>
                         <Button variant="outline" size="sm" className="text-xs" onClick={() => setSelectedElement({id: 'text-012', type: 'Text'})}>
                            Select Sample Text Block
                        </Button>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
