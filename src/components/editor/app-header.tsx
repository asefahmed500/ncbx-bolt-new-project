
"use client";

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { signOut as clientSignOut } from "next-auth/react"; 
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
import { publishWebsite } from '@/actions/website'; // Import the server action

export type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface AppHeaderProps {
  currentDevice?: DeviceType;
  onDeviceChange?: (device: DeviceType) => void;
  websiteId?: string | null; // Make websiteId prop optional and accept null
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function AppHeader({ currentDevice, onDeviceChange, websiteId }: AppHeaderProps) {
  const { data: session, status } = useSession();
  const [isAiCopyModalOpen, setIsAiCopyModalOpen] = useState(false);
  const [isTemplateGalleryModalOpen, setIsTemplateGalleryModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light'); 
  const { toast } = useToast();
  const pathname = usePathname();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved'); // Default to saved for non-editor pages
  const [isPublishing, setIsPublishing] = useState(false);

  const isEditorPage = pathname === '/editor';

  useEffect(() => {
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
      setSaveStatus('saved'); // Initial status for editor
      saveInterval = setInterval(() => {
        // Conceptual auto-save logic
        setSaveStatus('saving');
        // console.log("Conceptual auto-save triggered for websiteId:", websiteId);
        setTimeout(() => {
          setSaveStatus('saved'); 
        }, 1500);
      }, 30000); 
    }
    return () => {
      if (saveInterval) clearInterval(saveInterval);
    };
  }, [isEditorPage, websiteId]);

  const handlePublish = async () => {
    if (!websiteId) {
      toast({
        title: "Error",
        description: "No website is currently being edited to publish.",
        variant: "destructive",
      });
      return;
    }
    setIsPublishing(true);
    toast({ title: "Publishing...", description: "Your website is being published." });
    try {
      const result = await publishWebsite({ websiteId });
      if (result.success && result.website) {
        toast({
          title: "Website Published!",
          description: `"${result.website.name}" is now live.`,
        });
        // Optionally update local state if needed, e.g., a published status indicator
      } else {
        toast({
          title: "Publish Failed",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Publish Error",
        description: error.message || "An unexpected error occurred during publishing.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportCode = () => {
    if (!websiteId) {
      toast({ title: "Error", description: "No website selected to export.", variant: "destructive" });
      return;
    }
    console.log("Exporting website code (conceptual) for websiteId:", websiteId);
    toast({
      title: "Export Code Initiated (Conceptual)",
      description: "Website code download would begin here.",
    });
  };

  const handlePreview = () => {
    if (!websiteId) {
      toast({ title: "Error", description: "No website selected to preview.", variant: "destructive" });
      return;
    }
    console.log("Generating website preview (conceptual) for websiteId:", websiteId);
    toast({
      title: "Preview Requested (Conceptual)",
      description: "A shareable preview link would be generated.",
    });
    // Conceptual: window.open(`/preview/${websiteId}`, '_blank');
  };

  const handleSignOut = async () => {
    await clientSignOut({ callbackUrl: '/' });
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const showDeviceControls = isEditorPage && currentDevice && onDeviceChange;

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
            Saved
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-xs text-destructive mr-2">
            <AlertCircle className="h-4 w-4 mr-1" />
            Error saving
          </div>
        );
      default: // idle
        return <div className="flex items-center text-xs text-muted-foreground mr-2">Changes saved</div>;
    }
  };

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
                <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {showDeviceControls && onDeviceChange && (
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

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                  {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Toggle Theme ({currentTheme === 'light' ? 'Dark' : 'Light'})</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {renderSaveStatus()}

          {status === "authenticated" && session.user ? (
            <>
              {isEditorPage && (
                 <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handlePublish} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground hidden xs:flex"
                    disabled={isPublishing || !websiteId}
                  >
                  {isPublishing ? <Loader2 className="mr-1 md:mr-2 h-4 w-4 animate-spin" /> : <ArrowUpCircle className="mr-1 md:mr-2 h-4 w-4" />}
                  <span className="hidden md:inline">{isPublishing ? "Publishing..." : "Publish"}</span>
                </Button>
              )}
              
              {!isEditorPage && (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex items-center">
                    <Link href="/dashboard"><LayoutDashboard className="mr-1 h-4 w-4 md:mr-2" /><span className="hidden md:inline">Dashboard</span></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex items-center">
                    {/* Ensure editor link includes websiteId if one is contextually available or last edited */}
                    <Link href={websiteId ? `/editor?websiteId=${websiteId}` : "/editor"}><PencilRuler className="mr-1 h-4 w-4 md:mr-2" /><span className="hidden md:inline">Editor</span></Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsTemplateGalleryModalOpen(true)} className="hidden sm:flex items-center">
                    <LayoutGrid className="mr-1 h-4 w-4 md:mr-2" /><span className="hidden md:inline">Templates</span>
                  </Button>
                   <Button variant="outline" size="sm" onClick={() => setIsAiCopyModalOpen(true)} className="hidden sm:flex items-center">
                    <Wand2 className="mr-1 h-4 w-4 md:mr-2" /><span className="hidden md:inline">AI Copy</span>
                  </Button>
                </>
              )}
              
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
                  
                  <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                  
                  {isEditorPage ? (
                    <>
                      <DropdownMenuItem onClick={() => setIsTemplateGalleryModalOpen(true)}><LayoutGrid className="mr-2 h-4 w-4" />Load Template</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsAiCopyModalOpen(true)}><Wand2 className="mr-2 h-4 w-4" />AI Copy</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsSaveTemplateModalOpen(true)} disabled={!websiteId}><Save className="mr-2 h-4 w-4" />Save As Template</DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePreview} disabled={!websiteId}><Eye className="mr-2 h-4 w-4" />Preview Site</DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePublish} className="xs:hidden" disabled={isPublishing || !websiteId}>
                        {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpCircle className="mr-2 h-4 w-4" />}
                        {isPublishing ? "Publishing..." : "Publish Site"}
                      </DropdownMenuItem> 
                      <DropdownMenuItem onClick={handleExportCode} disabled={!websiteId}><Download className="mr-2 h-4 w-4" />Export Code</DropdownMenuItem>
                    </>
                  ) : (
                     <>
                      <DropdownMenuItem asChild className="sm:hidden"><Link href={websiteId ? `/editor?websiteId=${websiteId}` : "/editor"}><PencilRuler className="mr-2 h-4 w-4" />Editor</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsTemplateGalleryModalOpen(true)} className="sm:hidden"><LayoutGrid className="mr-2 h-4 w-4" />Templates</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsAiCopyModalOpen(true)} className="sm:hidden"><Wand2 className="mr-2 h-4 w-4" />AI Copy</DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  {session.user?.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin/dashboard"><ShieldCheckIcon className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem>}
                  {/* Settings link should be generic, actual settings page can be specific if needed */}
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
              <div className="h-8 w-20 rounded-md bg-muted animate-pulse hidden md:block" />
            </div>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost" size="sm"><Link href="/login"><LogIn className="mr-1 md:mr-2 h-4 w-4" /> Login</Link></Button>
                <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground"><Link href="/register"><UserPlus className="mr-1 md:mr-2 h-4 w-4" /> Register</Link></Button>
              </div>
              <div className="md:hidden"> {/* Mobile menu for unauthenticated users */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {publicNavLinks.map(link => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link href={link.href}><link.icon className="mr-2 h-4 w-4" />{link.label}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/login"><LogIn className="mr-2 h-4 w-4" />Login</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/register"><UserPlus className="mr-2 h-4 w-4" />Register</Link></DropdownMenuItem>
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
