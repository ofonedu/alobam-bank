
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AppLogo } from '@/components/layout/AppLogo';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { UserNav } from '@/components/layout/UserNav';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const isUserAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isUserAdmin) {
        router.push('/dashboard'); 
      }
    }
  }, [user, loading, isUserAdmin, router, userProfile]);

  if (loading || !user || !isUserAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">{!isUserAdmin && !loading && user ? "Access Denied. Redirecting..." : "Loading..."}</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4">
            <AppLogo colorVariant="sidebar" />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <DashboardNav isAdmin={true} />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SignOutButton className="w-full justify-start" />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col"> {/* This SidebarInset renders as a <main> tag */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:justify-end">
             <div className="md:hidden">
               <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <span className="text-sm font-semibold text-destructive">ADMIN PANEL</span>
                <ThemeToggle />
                <UserNav />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
          <footer className="p-4 text-center text-xs text-muted-foreground border-t border-border">
            © {currentYear} Wohana Funds. All rights reserved.
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
