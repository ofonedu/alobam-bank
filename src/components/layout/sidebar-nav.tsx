"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LayoutDashboard, ListChecks, ShieldAlert, Users, Settings } from "lucide-react";
import { PATHS } from "@/lib/paths";

const navItems = [
  { href: PATHS.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: PATHS.TRANSACTIONS, label: "Transactions", icon: ListChecks },
  { href: PATHS.KYC, label: "KYC Verification", icon: ShieldAlert },
  // Add more items here as needed
  // { href: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
  // { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== PATHS.DASHBOARD) }
              tooltip={item.label}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
