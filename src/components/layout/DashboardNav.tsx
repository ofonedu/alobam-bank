
// src/components/layout/DashboardNav.tsx
import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  UserCircle,
  ListChecks,
  Landmark,
  ShieldAlert,
  MessageSquare,
  Settings,
  Users,
  Send,
  DollarSign, 
  LifeBuoy, 
  Shapes,
  LayoutTemplate,
  KeyRound, // Added KeyRound
} from "lucide-react";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import type { DashboardNavItem } from '@/types';


const mainNavItems: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/kyc", label: "KYC Verification", icon: ShieldAlert },
  { href: "/dashboard/transactions", label: "Transactions", icon: ListChecks },
  { href: "/dashboard/loans", label: "Loans", icon: Landmark },
  { href: "/dashboard/transfer", label: "Fund Transfer", icon: Send },
  { href: "/dashboard/support", label: "Support", icon: MessageSquare },
];

const adminNavItems: DashboardNavItem[] = [
 { href: "/admin", label: "Admin Overview", icon: Settings },
 { href: "/admin/users", label: "Manage Users", icon: Users },
 { href: "/admin/kyc", label: "Manage KYC", icon: ShieldAlert },
 { href: "/admin/transactions", label: "Manage Transactions", icon: ListChecks },
 { href: "/admin/loans", label: "Manage Loans", icon: Landmark },
 { href: "/admin/financial-ops", label: "Financial Ops", icon: DollarSign },
 { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
 { href: "/admin/authorization-codes", label: "Auth Codes", icon: KeyRound }, // New Link
 { 
    href: "/admin/settings", 
    label: "System Settings", 
    icon: Settings, 
    subMenuPrefix: "/admin/settings",
    subItems: [
      { href: "/admin/settings/account-types", label: "Account Types", icon: Shapes },
      { href: "/admin/settings/landing-page", label: "Landing Page Content", icon: LayoutTemplate },
    ]
  },
];


export function DashboardNav({ isAdmin = false }: DashboardNavProps) {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const navItemsToRender = isAdmin ? adminNavItems : mainNavItems;
  const isUserAdmin = userProfile?.role === 'admin';

  return (
    <SidebarMenu>
      {navItemsToRender.map((item) => {
        const isActiveItem = pathname === item.href || !!(item.subMenuPrefix && pathname.startsWith(item.subMenuPrefix));
        
        return (
        <React.Fragment key={item.href}>
          <SidebarMenuItem>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                variant="default" 
                className={cn(
                  "w-full justify-start",
                  isActiveItem
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                isActive={isActiveItem}
                tooltip={{ content: item.label, side: "right", align: "center" }}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {isAdmin && item.subItems && item.subItems.length > 0 && isActiveItem && (
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                   <Link href={subItem.href} legacyBehavior passHref>
                      <SidebarMenuSubButton
                        className={cn(
                          pathname === subItem.href 
                          ? "bg-sidebar-accent/80 text-sidebar-accent-foreground" 
                          : "hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                        )}
                        isActive={!!(pathname === subItem.href)}
                      >
                        <subItem.icon className="mr-2 h-4 w-4" />
                        <span className="truncate">{subItem.label}</span>
                      </SidebarMenuSubButton>
                   </Link>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </React.Fragment>
      )})}
      {!isAdmin && isUserAdmin && (
        <SidebarMenuItem>
           <Link href="/admin" legacyBehavior passHref>
            <SidebarMenuButton
              variant="default"
              className={cn(
                "w-full justify-start mt-4 border-t border-sidebar-border pt-4",
                 pathname.startsWith("/admin")
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              isActive={!!pathname.startsWith("/admin")}
              tooltip={{ content: "Admin Panel", side: "right", align: "center" }}
            >
              <Settings className="mr-3 h-5 w-5" />
              <span className="truncate">Admin Panel</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}

    