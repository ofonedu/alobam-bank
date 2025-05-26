
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Banknote, Landmark, DraftingCompass, type LucideProps } from 'lucide-react';
import { getPlatformSettingsAction } from '@/lib/actions/admin-settings-actions';
import type { PlatformSettings } from '@/types';
import { cn } from '@/lib/utils';

// Define a type for the icon map keys
type IconName = "ShieldCheck" | "Banknote" | "Landmark" | "DraftingCompass" | "Default";

// Define the map for Lucide icons
const LucideIconResolver: Record<IconName, React.FC<LucideProps>> = {
  ShieldCheck,
  Banknote,
  Landmark,
  DraftingCompass,
  Default: ShieldCheck, // Fallback icon
};

interface AppLogoProps {
  colorVariant?: 'primary' | 'sidebar';
  className?: string;
}

export function AppLogo({ colorVariant = 'primary', className }: AppLogoProps) {
  const [logoText, setLogoText] = useState("Wohana Funds");
  const [logoIconName, setLogoIconName] = useState<IconName>("ShieldCheck");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      const result = await getPlatformSettingsAction();
      if (result.success && result.settings) {
        setLogoText(result.settings.platformLogoText || "Wohana Funds");
        setLogoIconName((result.settings.platformLogoIcon as IconName) || "ShieldCheck");
      } else {
        // Use defaults if fetch fails or settings are not present
        setLogoText("Wohana Funds");
        setLogoIconName("ShieldCheck");
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const IconComponent = LucideIconResolver[logoIconName] || LucideIconResolver.Default;

  const colorClasses = colorVariant === 'sidebar'
    ? 'text-sidebar-foreground hover:text-sidebar-foreground/90'
    : 'text-primary hover:text-primary/90';

  if (isLoading) {
    // Render a simple placeholder during loading to avoid layout shifts
    // Using the determined color class for consistency even in loading state
    return (
      <div className={cn("flex items-center gap-2", colorClasses, className)}>
        <ShieldCheck className="h-7 w-7" />
        <span className="text-xl font-semibold">Wohana Funds</span>
      </div>
    );
  }

  return (
    <Link href="/" className={cn("flex items-center gap-2 transition-colors", colorClasses, className)}>
      <IconComponent className="h-7 w-7" />
      <span className="text-xl font-semibold">{logoText}</span>
    </Link>
  );
}
