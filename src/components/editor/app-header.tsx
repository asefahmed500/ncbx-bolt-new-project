"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppLogo } from "@/components/icons/app-logo";
import { AiCopyModal } from "./ai-copy-modal";
import { TemplateGalleryModal } from "./template-gallery-modal";
import { Laptop, Smartphone, Tablet, Download, Wand2, LayoutGrid, User } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface AppHeaderProps {
  currentDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export function AppHeader({ currentDevice, onDeviceChange }: AppHeaderProps) {
  const [isAiCopyModalOpen, setIsAiCopyModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  const { toast } = useToast();

  const handleExport = () => {
    console.log("Exporting website...");
    toast({
      title: "Export Initiated",
      description: "Website export process has started (placeholder).",
    });
  };

  return (
    <>
      <header className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <AppLogo className="h-7" />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={currentDevice === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onDeviceChange('desktop')}
            aria-label="Desktop view"
            title="Desktop View"
          >
            <Laptop className="h-5 w-5" />
          </Button>
          <Button
            variant={currentDevice === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onDeviceChange('tablet')}
            aria-label="Tablet view"
            title="Tablet View"
          >
            <Tablet className="h-5 w-5" />
          </Button>
          <Button
            variant={currentDevice === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onDeviceChange('mobile')}
            aria-label="Mobile view"
            title="Mobile View"
          >
            <Smartphone className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsTemplateGalleryModalOpen(true)}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsAiCopyModalOpen(true)}>
            <Wand2 className="mr-2 h-4 w-4" />
            AI Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-accent text-accent-foreground hover:bg-accent/10 hover:text-accent-foreground">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="person avatar" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">User Name</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    user@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <AiCopyModal isOpen={isAiCopyModalOpen} onOpenChange={setIsAiCopyModalOpen} />
      <TemplateGalleryModal isOpen={isTemplateGalleryModalOpen} onOpenChange={setIsTemplateGalleryModalOpen} />
    </>
  );
}
