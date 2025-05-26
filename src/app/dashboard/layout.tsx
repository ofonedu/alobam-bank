
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="p-4">
            <AppLogo />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <DashboardNav />
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
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <UserNav />
            </div>
          </header>
           {/* Changed inner <main> to <div> for semantic correctness and applied flex for content growth */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
