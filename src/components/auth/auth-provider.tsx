"use client";

import type { ReactNode } from 'react';
import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { usePathname, useRouter } from 'next/navigation';
import { PATHS } from '@/lib/paths';
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === PATHS.LOGIN || pathname === PATHS.SIGNUP;
    const isHomePage = pathname === PATHS.HOME;

    if (!user && !isAuthPage && !isHomePage) {
      router.push(PATHS.LOGIN);
    } else if (user && (isAuthPage || isHomePage)) {
      router.push(PATHS.DASHBOARD);
    } else if (!user && isHomePage) {
      router.push(PATHS.LOGIN);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    // This full-screen loader can be customized.
    // For protected routes, it prevents flashing unauthenticated content.
    // For public routes like /login, it's mostly invisible if auth resolves quickly.
    const isAppRoute = Object.values(PATHS).includes(pathname) && pathname !== PATHS.LOGIN && pathname !== PATHS.SIGNUP && pathname !== PATHS.HOME;
    if (isAppRoute || (pathname === PATHS.HOME && !user)) {
       return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="space-y-4 p-8 rounded-lg shadow-xl bg-card w-full max-w-md">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-1/2 mx-auto mt-4" />
          </div>
        </div>
      );
    }
  }
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
