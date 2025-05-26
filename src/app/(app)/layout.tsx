"use client";
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Logo } from "@/components/layout/logo";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth/auth-provider';
import { Loader2 } from 'lucide-radix'; // Corrected import

export default function AppLayout({ children }: { children: ReactNode }) {
  const { loading: authLoading, user } = useAuth();

  if (authLoading || !user) { // Ensure user is loaded before rendering app layout
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader className="p-0">
          <div className="flex items-center justify-between p-2 h-[var(--header-height)]">
            <Logo />
          </div>
        </SidebarHeader>
        <Separator />
        <SidebarContent className="p-2">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2">
          {/* Footer content if any, e.g. help links, settings icon outside of UserNav */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-[var(--header-height)] items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6" style={{ '--header-height': '3.5rem' } as React.CSSProperties}>
          <div className="flex items-center">
            <SidebarTrigger className="md:hidden" /> {/* Mobile sidebar toggle */}
            <h1 className="text-lg font-semibold ml-2 md:ml-0">VerifAI</h1>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
