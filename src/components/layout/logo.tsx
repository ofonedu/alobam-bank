import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { PATHS } from '@/lib/paths';

export function Logo({ collapsed } : { collapsed?: boolean }) {
  return (
    <Link href={PATHS.HOME} className="flex items-center gap-2 px-2 h-12">
      <ShieldCheck className="h-7 w-7 text-primary" />
      {!collapsed && <span className="text-xl font-bold text-foreground">VerifAI</span>}
    </Link>
  );
}
