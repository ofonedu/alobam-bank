
"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { SignOutButtonProps } from "@/types";

export function SignOutButton({ className }: SignOutButtonProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      console.error("Sign out error:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Button variant="ghost" onClick={handleSignOut} className={className}>
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
