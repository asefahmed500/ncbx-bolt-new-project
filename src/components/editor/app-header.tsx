
"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { signOut } from "@/auth"; // Assuming this is your server action signOut
import { signIn } from "next-auth/react"; // Client-side signIn
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
import { Laptop, Smartphone, Tablet, ArrowUpCircle, Wand2, LayoutGrid, User, LogOut, LogIn, Moon, Sun, LayoutDashboard, PencilRuler, Home, Info, Briefcase, DollarSign, UserPlus, HelpCircle, Settings, ShieldCheckIcon, Save, Eye, Download, ZoomIn, ZoomOut, Loader2, CheckCircle, AlertCircle, Menu } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface AppHeaderProps {
  currentDevice?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  // currentWebsiteId?: string; // Conceptual
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AppHeader({ currentDevice, onDeviceChange }: AppHeaderProps) {
  const { data: session, status } = useSession();
  const [isAiCopyModalOpen, setIsAiCopyModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light'); // Default theme
  const { toast } = useToast();
  const pathname = usePathname();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  const isEditorPage = pathname === '/editor';

  useEffect(() => {
    // Set initial theme based on system preference or stored preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      setCurrentTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      setCurrentTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);


  useEffect(() => {
    let saveInterval: NodeJS.Timeout | undefined;
    if (isEditorPage) {
      saveInterval = setInterval(() => {
        setSaveStatus('saving');
        setTimeout(() => {
          setSaveStatus('saved'); // Simulate save completion
        }, 1500);
      }, 10000); // Simulate auto-save every 10 seconds
    }
    return () => {
      if (saveInterval) clearInterval(saveInterval);
    };
  }, [isEditorPage]);

  const handlePublish = async () => {
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
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    // toast({ // Optional: toast notification for theme change
    //   title: "Theme Changed",
    //   description: `Theme is now ${newTheme}.`,
    // });
  };

  const showDeviceControls = currentDevice && onDeviceChange;

  const publicNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#about", label: "About", icon: Info },
    { href: "/#services", label: "Services", icon: Briefcase },
    { href: "/#pricing", label: "Pricing", icon: DollarSign },
    { href: "/#support", label: "Support", icon: HelpCircle },
  ];

  const renderSaveStatus = () => {
    if (!isEditorPage) return null;
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center text-xs text-muted-foreground mr-2">
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            Saving...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center text-xs text-green-600 mr-2">
            <CheckCircle className="h-4 w-4 mr-1" />
            All changes saved
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-xs text-destructive mr-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            Error saving
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 min-h-[60px]">
        {/* Logo and Desktop Public Nav (if unauthenticated) */}
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Go to homepage">
            <AppLogo className="h-7" />
          </Link>
          {!isEditorPage && status !== 'authenticated' && (
            <nav className="hidden md:flex items-center gap-3 ml-6">
              {publicNavLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Device Controls (Editor Page Only) */}
        {showDeviceControls && (
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1 sm:gap-2">
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><Button variant={currentDevice === 'desktop' ? 'secondary' : 'ghost'} size="icon" onClick={() => onDeviceChange('desktop')} aria-label="Desktop view"><Laptop className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Desktop</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant={currentDevice === 'tablet' ? 'secondary' : 'ghost'} size="icon" onClick={() => onDeviceChange('tablet')} aria-label="Tablet view"><Tablet className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Tablet</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button variant={currentDevice === 'mobile' ? 'secondary' : 'ghost'} size="icon" onClick={() => onDeviceChange('mobile')} aria-label="Mobile view"><Smartphone className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Mobile</p></TooltipContent></Tooltip>
            </TooltipProvider>
            {isEditorPage && (
              <TooltipProvider>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><ZoomOut className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Zoom Out (Conceptual)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><ZoomIn className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Zoom In (Conceptual)</p></TooltipContent></Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* Right side: Theme toggle, Save Status, Auth Controls / User Menu */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                  {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Toggle Theme</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {renderSaveStatus()}

          {status === "authenticated" ? (
            <>
              {/* Authenticated User Buttons - some with responsive text */}
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/dashboard"><LayoutDashboard className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">Dashboard</span></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/editor"><PencilRuler className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">Editor</span></Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsTemplateGalleryModalOpen(true)} className="hidden sm:flex">
                <LayoutGrid className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">Templates</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAiCopyModalOpen(true)} className="hidden sm:flex">
                <Wand2 className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">AI Copy</span>
              </Button>

              {isEditorPage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsSaveTemplateModalOpen(true)} className="hidden xs:flex">
                    <Save className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">Save As Template</span>
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handlePreview} disabled className="hidden xs:flex">
                          <Eye className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">Preview</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Conceptual: Shareable preview.</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="default" size="sm" onClick={handlePublish} className="bg-primary hover:bg-primary/90 text-primary-foreground hidden xs:flex">
                    <ArrowUpCircle className="mr-1 md:mr-2 h-4 w-4" /><span className="hidden md:inline">Publish</span>
                  </Button>
                </>
              )}
              
              {/* User Avatar Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user?.avatarUrl || "https://placehold.co/100x100.png"} alt={session.user?.name || "User Avatar"} data-ai-hint="person avatar"/>
                      <AvatarFallback>{session.user?.name ? session.user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* Responsive items for small screens (visible in dropdown) */}
                  <DropdownMenuItem asChild className="sm:hidden"><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild className="sm:hidden"><Link href="/editor"><PencilRuler className="mr-2 h-4 w-4" />Editor</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsTemplateGalleryModalOpen(true)} className="sm:hidden"><LayoutGrid className="mr-2 h-4 w-4" />Templates</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsAiCopyModalOpen(true)} className="sm:hidden"><Wand2 className="mr-2 h-4 w-4" />AI Copy</DropdownMenuItem>
                  {isEditorPage && (
                    <>
                      <DropdownMenuItem onClick={() => setIsSaveTemplateModalOpen(true)} className="xs:hidden"><Save className="mr-2 h-4 w-4" />Save As Template</DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePreview} disabled className="xs:hidden"><Eye className="mr-2 h-4 w-4" />Preview</DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePublish} className="xs:hidden"><ArrowUpCircle className="mr-2 h-4 w-4" />Publish</DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportCode}><Download className="mr-2 h-4 w-4" />Export Code (Conceptual)</DropdownMenuItem>
                      <DropdownMenuSeparator className="sm:hidden" />
                    </>
                  )}
                  
                  <DropdownMenuItem asChild><Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  {session.user?.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin/dashboard"><ShieldCheckIcon className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem>}
                  <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/#support"><HelpCircle className="mr-2 h-4 w-4" />Support</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : status === "loading" ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
              <div className="h-8 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              {/* Unauthenticated User Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm"><Link href="/login"><LogIn className="mr-1 md:mr-2 h-4 w-4" /> Login</Link></Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground"><Link href="/register"><UserPlus className="mr-1 md:mr-2 h-4 w-4" /> Register</Link></Button>
              </div>
              {/* Mobile Menu for Unauthenticated Users */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isEditorPage && publicNavLinks.map(link => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}><link.icon className="mr-2 h-4 w-4" />{link.label}</Link>
                      </DropdownMenuItem>
                    ))}
                    {!isEditorPage && <DropdownMenuSeparator />}
                    <DropdownMenuItem asChild><Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/register"><UserPlus className="mr-2 h-4 w-4" />Register</Link></DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>
      </header>
      {/* Modals - only initialized if user is authenticated */}
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


    