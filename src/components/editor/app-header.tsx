
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Laptop, Smartphone, Tablet, ArrowUpCircle, Wand2, LayoutGrid, User, LogOut, LogIn, Moon, Sun, LayoutDashboard, PencilRuler, Home, Info, Briefcase, DollarSign, UserPlus, HelpCircle, Settings, ShieldCheckIcon, Save, Eye, Download, ZoomIn, ZoomOut, Loader2, CheckCircle, AlertCircle, Menu, CloudOff, PackagePlus } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';
import { publishWebsite, unpublishWebsite, getWebsiteMetadata, saveWebsiteContent, type SaveWebsiteContentInput } from '@/actions/website';
import type { IWebsite, IWebsiteVersion, IWebsiteVersionPage } from '@/models/Website';
import { STRIPE_PRICE_ID_PRO_MONTHLY } from '@/config/plans';

export type DeviceType = 'desktop' | 'tablet' | 'mobile';
export type EditorSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'unsaved_changes';


interface AppHeaderProps {
  currentDevice?: DeviceType; 
  onDeviceChange?: (device: DeviceType) => void; 
  websiteId?: string | null; 
  getEditorContentForSave?: () => SaveWebsiteContentInput['pages']; 
  editorSaveStatus?: EditorSaveStatus; 
  onOpenSaveTemplateModal?: () => void;
  onOpenTemplateGalleryModal?: () => void;
}


export function AppHeader({ 
  currentDevice, 
  onDeviceChange, 
  websiteId,
  getEditorContentForSave,
  editorSaveStatus, 
  onOpenSaveTemplateModal,
  onOpenTemplateGalleryModal 
}: AppHeaderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isAiCopyModalOpen, setIsAiCopyModalOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [websiteData, setWebsiteData] = useState<IWebsite | null>(null);
  const [isLoadingWebsiteData, setIsLoadingWebsiteData] = useState(false);

  const isEditorPage = pathname === '/editor' && !!websiteId;
  const isStripeProPriceIdMissing = !STRIPE_PRICE_ID_PRO_MONTHLY || STRIPE_PRICE_ID_PRO_MONTHLY.includes('YOUR_PRO_MONTHLY_PRICE_ID');


  const fetchWebsiteData = useCallback(async () => {
    if (isEditorPage && websiteId) {
      setIsLoadingWebsiteData(true);
      try {
        const result = await getWebsiteMetadata(websiteId);
        if (result.website) {
          setWebsiteData(result.website);
        } else if (result.error) {
          toast({ title: "Error fetching website data", description: result.error, variant: "destructive" });
          setWebsiteData(null);
        }
      } catch (error: any) {
        toast({ title: "Error", description: `Failed to load website details: ${error.message}`, variant: "destructive" });
        setWebsiteData(null);
      } finally {
        setIsLoadingWebsiteData(false);
      }
    } else {
      setWebsiteData(null);
    }
  }, [isEditorPage, websiteId, toast]);

  useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);
  
  useEffect(() => {
    if (isEditorPage && websiteId) {
      fetchWebsiteData();
    }
  }, [websiteId, isEditorPage, fetchWebsiteData]);


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


  const handlePublish = async () => {
    if (!websiteId || !websiteData) { 
      toast({ title: "Error", description: "No website selected or data loaded.", variant: "destructive" });
      return;
    }
    if (editorSaveStatus === 'unsaved_changes' || editorSaveStatus === 'error') {
       toast({ title: "Save Required", description: "Please save your changes before publishing.", variant: "destructive" });
       return;
    }

    setIsPublishing(true);
    toast({ title: "Publishing...", description: `Publishing website "${websiteData?.name || 'your site'}".` });
    try {
      const result = await publishWebsite({ websiteId });
      if (result.success && result.website) {
        toast({ title: "Website Published!", description: `"${result.website.name}" is now live.` });
        setWebsiteData(result.website); 
      } else {
        toast({ title: "Publish Failed", description: result.error || "Unknown error.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Publish Error", description: error.message, variant: "destructive" });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!websiteId || !websiteData) {
      toast({ title: "Error", description: "No website selected or data loaded.", variant: "destructive" });
      return;
    }
    setIsUnpublishing(true);
    toast({ title: "Unpublishing...", description: `Taking website "${websiteData?.name || 'your site'}" offline.` });
    try {
      const result = await unpublishWebsite({ websiteId });
      if (result.success && result.website) {
        toast({ title: "Website Unpublished!", description: `"${result.website.name}" is no longer live.` });
        setWebsiteData(result.website);
      } else {
        toast({ title: "Unpublish Failed", description: result.error || "Unknown error.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Unpublish Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleExportCode = () => {
    if (!websiteId) {
      toast({ title: "Error", description: "No website selected to export.", variant: "destructive" });
      return;
    }
    console.log("Exporting website code (conceptual) for websiteId:", websiteId);
    toast({ title: "Export Code Initiated (Conceptual)", description: "Website code download would begin here." });
  };

  const handlePreview = () => {
    if (!websiteId || !websiteData) {
      toast({ title: "Error", description: "No website selected or data loaded to preview.", variant: "destructive" });
      return;
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_DOMAIN || "notthedomain.com";
    const siteUrl = websiteData?.customDomain && websiteData?.domainStatus === 'verified'
      ? `https://${websiteData.customDomain}`
      : `https://${websiteData?.subdomain}.${baseUrl}`;

    if (websiteData?.subdomain || (websiteData?.customDomain && websiteData?.domainStatus === 'verified')) {
       if (websiteData.status === 'published') {
        window.open(siteUrl, '_blank');
      } else {
        toast({ title: "Site Not Published", description: "Publish your site to view it live. You can preview unsaved changes in the editor.", variant: "default" });
      }
    } else {
      toast({ title: "Cannot Preview", description: "Website needs to be published with a subdomain or verified custom domain.", variant: "destructive" });
    }
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
    { href: "/about", label: "About", icon: Info },
    { href: "/services", label: "Services", icon: Briefcase },
    { href: "/pricing", label: "Pricing", icon: DollarSign },
    { href: "/support", label: "Support", icon: HelpCircle },
  ];

  const renderPublishStatus = () => {
    if (!isEditorPage) return null;
    if (isLoadingWebsiteData && !websiteData) return <div className="flex items-center text-xs text-muted-foreground mr-2"><Loader2 className="h-4 w-4 mr-1 animate-spin" />Loading Status...</div>;
    if (!websiteData) return <div className="flex items-center text-xs text-muted-foreground mr-2"><AlertCircle className="h-4 w-4 mr-1" />Status N/A</div>;
    
    let statusText = "Draft";
    let statusColor = "text-amber-600";
    let IconComponent = PencilRuler;

    switch (websiteData.status) {
      case 'published':
        statusText = `Published`;
        statusColor = "text-green-600";
        IconComponent = Eye;
        break;
      case 'unpublished':
        statusText = "Unpublished";
        statusColor = "text-muted-foreground";
        IconComponent = CloudOff;
        break;
      case 'error_publishing':
        statusText = "Publish Error";
        statusColor = "text-destructive";
        IconComponent = AlertCircle;
        break;
      case 'draft':
      default:
        statusText = "Draft";
        statusColor = "text-amber-600";
        IconComponent = PencilRuler;
        break;
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center text-xs ${statusColor} mr-3`}>
              <IconComponent className="h-4 w-4 mr-1" />
              {statusText}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Status: {statusText}</p>
            {websiteData.status === 'published' && websiteData.lastPublishedAt && (
              <p className="text-xs">Last published: {new Date(websiteData.lastPublishedAt).toLocaleString()}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  const canPublish = editorSaveStatus === 'saved' || editorSaveStatus === 'idle';
  let publishTooltipContent = "Publish your website to make it live.";
  if (editorSaveStatus === 'unsaved_changes' || editorSaveStatus === 'error') {
    publishTooltipContent = "Please save your changes before publishing.";
  }


  return (
    <>
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50 min-h-[60px]">
        <div className="flex items-center gap-4">
          <Link href={sessionStatus === 'authenticated' ? "/dashboard" : "/"} aria-label="Go to homepage/dashboard">
            <AppLogo className="h-7" />
          </Link>
          {!isEditorPage && sessionStatus !== 'authenticated' && (
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
                 <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><ZoomOut className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Zoom Out (Conceptual)</p></TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" disabled><ZoomIn className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent><p>Zoom In (Conceptual)</p></TooltipContent></Tooltip>
            </TooltipProvider>
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
          
          {isEditorPage && renderPublishStatus()}

          {sessionStatus === "authenticated" && session.user ? (
            <>
              {isEditorPage && (
                <>
                  {websiteData?.status === 'published' ? (
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleUnpublish} 
                        className="hidden xs:flex"
                        disabled={isUnpublishing || isLoadingWebsiteData}
                      >
                      {isUnpublishing ? <Loader2 className="mr-1 md:mr-2 h-4 w-4 animate-spin" /> : <CloudOff className="mr-1 md:mr-2 h-4 w-4" />}
                      <span className="hidden md:inline">Unpublish</span>
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <div className="hidden xs:flex"> {/* Wrapper div for TooltipTrigger when button is disabled */}
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={handlePublish} 
                              className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              disabled={isPublishing || isLoadingWebsiteData || !canPublish}
                            >
                              {isPublishing ? <Loader2 className="mr-1 md:mr-2 h-4 w-4 animate-spin" /> : <ArrowUpCircle className="mr-1 md:mr-2 h-4 w-4" />}
                              <span className="hidden md:inline">Publish</span>
                            </Button>
                           </div>
                        </TooltipTrigger>
                        <TooltipContent><p>{publishTooltipContent}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button variant="secondary" size="sm" className="hidden sm:flex items-center" onClick={handlePreview} disabled={isLoadingWebsiteData || !websiteData || (!websiteData?.subdomain && !websiteData?.customDomain)}>
                      <Eye className="mr-1 h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">{websiteData?.status === 'published' ? 'View Live' : 'Preview'}</span>
                  </Button>
                </>
              )}
              
              {!isEditorPage && (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex items-center">
                    <Link href="/dashboard"><LayoutDashboard className="mr-1 h-4 w-4 md:mr-2" /><span className="hidden md:inline">Dashboard</span></Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:flex items-center">
                    <Link href="/dashboard/websites/create"><PencilRuler className="mr-1 h-4 w-4 md:mr-2" /><span className="hidden md:inline">New Site</span></Link>
                  </Button>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user?.avatarUrl || `https://placehold.co/100x100.png?text=${session.user?.name?.charAt(0) || 'U'}`} alt={session.user?.name || "User Avatar"} data-ai-hint="person avatar"/>
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
                      {onOpenTemplateGalleryModal && <DropdownMenuItem onClick={onOpenTemplateGalleryModal}><LayoutGrid className="mr-2 h-4 w-4" />Load Template</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => setIsAiCopyModalOpen(true)}><Wand2 className="mr-2 h-4 w-4" />AI Copy</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {onOpenSaveTemplateModal && <DropdownMenuItem onClick={onOpenSaveTemplateModal} disabled={!websiteId}><PackagePlus className="mr-2 h-4 w-4" />Save As Template</DropdownMenuItem>}
                      <DropdownMenuItem onClick={handlePreview} disabled={isLoadingWebsiteData || !websiteData || !websiteId }><Eye className="mr-2 h-4 w-4" />{websiteData?.status === 'published' ? 'View Live Site' : 'Preview Site'}</DropdownMenuItem>
                      
                      {websiteData?.status === 'published' ? (
                        <DropdownMenuItem onClick={handleUnpublish} className="xs:hidden" disabled={isUnpublishing || isLoadingWebsiteData}>
                          {isUnpublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CloudOff className="mr-2 h-4 w-4" />}
                          Unpublish Site
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={handlePublish} className="xs:hidden" disabled={isPublishing || isLoadingWebsiteData || !canPublish}>
                          {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpCircle className="mr-2 h-4 w-4" />}
                           Publish Site
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleExportCode} disabled={!websiteId}><Download className="mr-2 h-4 w-4" />Export Code</DropdownMenuItem>
                    </>
                  ) : (
                     <>
                       <DropdownMenuItem asChild className="sm:hidden"><Link href="/dashboard/websites/create"><PencilRuler className="mr-2 h-4 w-4" />New Site</Link></DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link href="/dashboard/profile"><User className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
                  {session.user?.role === 'admin' && <DropdownMenuItem asChild><Link href="/admin/dashboard"><ShieldCheckIcon className="mr-2 h-4 w-4" />Admin Panel</Link></DropdownMenuItem>}
                  <DropdownMenuItem asChild><Link href={isEditorPage && websiteId ? `/dashboard/websites/${websiteId}/settings` : "/dashboard"}><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/support"><HelpCircle className="mr-2 h-4 w-4" />Support</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : sessionStatus === "loading" ? (
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
              <div className="md:hidden"> 
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
      {sessionStatus === "authenticated" && (
        <>
          <AiCopyModal isOpen={isAiCopyModalOpen} onOpenChange={setIsAiCopyModalOpen} />
        </>
      )}
    </>
  );
}

declare module '@/models/Website' {
    interface IPageComponent {
      _id?: string | import('mongoose').Types.ObjectId;
    }
    interface IWebsiteVersionPage {
      _id?: string | import('mongoose').Types.ObjectId;
    }
  }
  
import mongoose from 'mongoose';
