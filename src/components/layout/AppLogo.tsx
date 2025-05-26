
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Banknote, Landmark, DraftingCompass, type LucideProps } from 'lucide-react';
import { getPlatformSettingsAction } from '@/lib/actions/admin-settings-actions';
import type { PlatformSettings } from '@/types';

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

export function AppLogo() {
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

  if (isLoading) {
    // Render a simple placeholder during loading to avoid layout shifts
    return (
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-7 w-7" />
        <span className="text-xl font-semibold">Wohana Funds</span>
      </div>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <IconComponent className="h-7 w-7" />
      <span className="text-xl font-semibold">{logoText}</span>
    </Link>
  );
}
