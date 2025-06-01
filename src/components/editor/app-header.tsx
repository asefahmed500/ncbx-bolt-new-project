
"use client";

import { useState } from 'react';
import { useSession } from "next-auth/react";
import { signOut } from "@/auth";
import { signIn } from "next-auth/react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppLogo } from "@/components/icons/app-logo";
import { AiCopyModal } from "./ai-copy-modal";
import { TemplateGalleryModal } from "./template-gallery-modal";
import { SaveTemplateModal } from "./save-template-modal";
import { Laptop, Smartphone, Tablet, ArrowUpCircle, Wand2, LayoutGrid, User, LogOut, LogIn, Moon, Sun, LayoutDashboard, PencilRuler, Home, Info, Briefcase, DollarSign, UserPlus, HelpCircle, Settings, ShieldCheckIcon, Save, Eye, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
// import { publishWebsite } from '@/actions/website'; // Conceptual: would be used by handlePublish

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface AppHeaderProps {
  currentDevice?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  // Conceptually, the ID of the website being edited would be available here
  // currentWebsiteId?: string;
}

export function AppHeader({ currentDevice, onDeviceChange }: AppHeaderProps) {
  const { data: session, status } = useSession();
  const [isAiCopyModalOpen, setIsAiCopyModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const { toast } = useToast();
  const pathname = usePathname();

  const handlePublish = async () => {
    // In a real app, you'd get the websiteId from the current editor context/props
    // const websiteId = props.currentWebsiteId;
    // if (!websiteId) {
    //   toast({ title: "Error", description: "No website is currently being edited.", variant: "destructive" });
    //   return;
    // }
    // const result = await publishWebsite({ websiteId });
    // if (result.success) {
    //   toast({
    //     title: "Website Published!",
    //     description: `Status: ${result.website?.status}. Your site will be live shortly.`,
    //   });
    // } else {
    //   toast({
    //     title: "Publish Failed",
    //     description: result.error,
    //     variant: "destructive",
    //   });
    // }
    console.log("Publishing website (conceptual)...");
    toast({
      title: "Publish Initiated (Conceptual)",
      description: "The website publishing process would start now.",
    });
  };

  const handleExportCode = () => {
    console.log("Exporting website code (conceptual)...");
    toast({
      title: "Export Code Initiated (Conceptual)",
      description: "Website code download would begin here.",
    });
  };

  const handlePreview = () => {
    console.log("Generating website preview (conceptual)...");
    toast({
      title: "Preview Requested (Conceptual)",
      description: "A shareable preview link would be generated.",
    });
  };


  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  }

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    toast({
      title: "Theme Changed (Placeholder)",
      description: `Theme is now ${newTheme}. Actual implementation with persistent state needed.`,
    });
  };

  const showDeviceControls = currentDevice && onDeviceChange;
  const isEditorPage = pathname === '/editor';

  const publicNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#about", label: "About", icon: Info },
    { href: "/#services", label: "Services", icon: Briefcase },
    { href: "/#pricing", label: "Pricing", icon: DollarSign },
    { href: "/#support", label: "Support", icon: HelpCircle },
  ];

  return (
    <>
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 min-h-[60px]">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Go to homepage">
            <AppLogo className="h-7" />
          </Link>

          {!isEditorPage && status !== 'authenticated' && (
             <nav className="hidden md:flex items-center gap-3 ml-6">
              {publicNavLinks.map(link => (
                <Link key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>


        {showDeviceControls && (
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
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

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle Theme">
            {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {status === "authenticated" ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/editor">
                  <PencilRuler className="mr-1 md:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Editor</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsTemplateGalleryModalOpen(true)}>
                <LayoutGrid className="mr-1 md:mr-2 h-4 w-4" />
                 <span className="hidden md:inline">Templates</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAiCopyModalOpen(true)}>
                <Wand2 className="mr-1 md:mr-2 h-4 w-4" />
                <span className="hidden md:inline">AI Copy</span>
              </Button>
               {isEditorPage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsSaveTemplateModalOpen(true)}>
                    <Save className="mr-1 md:mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Save Template</span>
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handlePreview} disabled>
                          <Eye className="mr-1 md:mr-2 h-4 w-4" />
                          <span className="hidden md:inline">Preview</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Conceptual: Generates a shareable preview deployment.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="default" size="sm" onClick={handlePublish} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <ArrowUpCircle className="mr-1 md:mr-2 h-4 w-4" />
                     <span className="hidden md:inline">Publish</span>
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user?.avatarUrl || "https://placehold.co/100x100.png"} alt={session.user?.name || "User Avatar"} data-ai-hint="person avatar"/>
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

                  <div className="md:hidden">
                    {publicNavLinks.map(link => (
                      <DropdownMenuItem key={link.label} asChild>
                        <Link href={link.href} >
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                  {isEditorPage && (
                    <>
                    <DropdownMenuItem onClick={handleExportCode}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Code (Conceptual)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild><Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  {session.user?.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin/dashboard"><ShieldCheckIcon className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem>}
                  <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/support"><HelpCircle className="mr-2 h-4 w-4" />Support</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : status === "loading" ? (
            <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
          ) : (
            <>

              <nav className="hidden lg:flex items-center gap-3 ml-4">
                {publicNavLinks.map(link => (
                  <Link key={link.label} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-2 ml-auto">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">
                    <LogIn className="mr-1 md:mr-2 h-4 w-4" /> Login
                  </Link>
                </Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/register">
                    <UserPlus className="mr-1 md:mr-2 h-4 w-4" /> Register
                  </Link>
                </Button>
              </div>

              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {publicNavLinks.map(link => (
                      <DropdownMenuItem key={link.label} asChild>
                        <Link href={link.href}>
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </header>
      {status === "authenticated" && (
        <>
          <AiCopyModal isOpen={isAiCopyModalOpen} onOpenChange={setIsAiCopyModalOpen} />
          <TemplateGalleryModal isOpen={isTemplateGalleryModalOpen} onOpenChange={setIsTemplateGalleryModalOpen} />
          {isEditorPage && <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onOpenChange={setIsSaveTemplateModalOpen} />}
        </>
      )}
    </>
  );
}

    