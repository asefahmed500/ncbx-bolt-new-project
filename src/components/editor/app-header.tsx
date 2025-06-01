
"use client";

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { signIn, signOut } from "@/auth";
import Link from 'next/link';
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
import { Laptop, Smartphone, Tablet, Download, Wand2, LayoutGrid, User, LogOut, LogIn, Moon, Sun, LayoutDashboard, PencilRuler } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface AppHeaderProps {
  currentDevice?: DeviceType; // Optional: For editor view
  onDeviceChange?: (device: DeviceType) => void; // Optional: For editor view
}

export function AppHeader({ currentDevice, onDeviceChange }: AppHeaderProps) {
  const { data: session, status } = useSession();
  const [isAiCopyModalOpen, setIsAiCopyModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  // Placeholder for theme state
  const [currentTheme, setCurrentTheme] = useState('light'); // Replace with actual theme logic
  const { toast } = useToast();

  const handleExport = () => {
    console.log("Exporting website...");
    toast({
      title: "Export Initiated",
      description: "Website export process has started (placeholder).",
    });
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  }

  const toggleTheme = () => {
    // Placeholder: Implement actual theme toggling logic here (e.g., using next-themes)
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
    toast({
      title: "Theme Changed (Placeholder)",
      description: `Theme is now ${currentTheme === 'light' ? 'dark' : 'light'}. Actual implementation needed.`,
    });
  };

  const showDeviceControls = currentDevice && onDeviceChange;

  return (
    <>
      <header className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <AppLogo className="h-7" />
          </Link>
        </div>

        {/* Device Controls - only shown if props are passed (i.e., in editor view) */}
        {showDeviceControls && (
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
        )}

        {/* Central navigation items or empty space if no device controls */}
        {!showDeviceControls && <div className="flex-1"></div>}


        <div className="flex items-center gap-3">
          {status === "authenticated" && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              {/* Show Editor link if not on editor page, or if device controls are not shown (meaning we might be on dashboard) */}
              {(showDeviceControls || (currentDevice === undefined) ) && (
                 <Button variant="ghost" size="sm" asChild>
                  <Link href="/editor">
                    <PencilRuler className="mr-2 h-4 w-4" />
                    Editor
                  </Link>
                </Button>
              )}
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
            </>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle Theme">
            {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {status === "authenticated" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.avatarUrl || "https://placehold.co/100x100.png"} alt={session.user?.name || "User Avatar"} data-ai-hint="person avatar" />
                    <AvatarFallback>
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                {session.user?.role === 'admin' && <DropdownMenuItem>Admin Panel</DropdownMenuItem>}
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : status === "loading" ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </header>
      {status === "authenticated" && (
        <>
          <AiCopyModal isOpen={isAiCopyModalOpen} onOpenChange={setIsAiCopyModalOpen} />
          <TemplateGalleryModal isOpen={isTemplateGalleryModalOpen} onOpenChange={setIsTemplateGalleryModalOpen} />
        </>
      )}
    </>
  );
}
