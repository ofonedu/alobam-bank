
// src/hooks/use-auth.tsx
"use client";

import type { ReactNode} from 'react';
import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { AuthUser, UserProfile } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { z } from "zod";
import type { AuthSchema, RegisterFormData, ChangePasswordFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast"; 
import { sendTransactionalEmail } from '@/lib/email-service';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (data: z.infer<typeof AuthSchema>) => Promise<AuthUser | null>;
  signUp: (data: RegisterFormData) => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
  changeUserPassword: (data: ChangePasswordFormData) => Promise<{ success: boolean; message: string }>;
  userProfile: UserProfile | null;
  fetchUserProfile: (uid: string) => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast(); 

  const fetchUserProfile = async (uid: string): Promise<void> => {
    const userDocRef = doc(db, "users", uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        console.warn(`User profile document not found for UID: ${uid}. User might be new or data is missing.`);
        setUserProfile(null); 
      }
    } catch (error: any) {
      setUserProfile(null); 
      if (error.code === 'unavailable' || error.message?.includes("client is offline") || error.message?.includes("Failed to get document because the client is offline")) {
        console.warn("fetchUserProfile: Firestore client is offline or unreachable:", error.message);
        toast({
          title: "Network Issue",
          description: "Could not load your profile details. You appear to be offline.",
          variant: "destructive",
        });
      } else {
        console.error("fetchUserProfile: Error fetching user profile:", error);
        toast({
          title: "Profile Error",
          description: "Could not load your profile details due to an unexpected error.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setLoading(true); 
      if (firebaseUser) {
        setUser(firebaseUser as AuthUser); 
        await fetchUserProfile(firebaseUser.uid); 
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 
  
  const signIn = async (data: z.infer<typeof AuthSchema>) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        if (profileData.isSuspended) {
          await firebaseSignOut(auth); 
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          throw { code: 'auth/user-disabled', message: 'Your account has been suspended. Please contact support.' };
        }
        setUserProfile(profileData);
      } else {
        setUserProfile(null);
        console.warn(`signIn: User profile not found for UID: ${firebaseUser.uid} after login.`);
      }
      
      setUser(firebaseUser as AuthUser); 
      setLoading(false);
      return firebaseUser as AuthUser;
    } catch (error) {
      setLoading(false);
      throw error; 
    }
  };

  const signUp = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const newUser = userCredential.user;
      
      const userDocRef = doc(db, "users", newUser.uid);
      const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const initialBalance = 0; 
      const constructedDisplayName = `${data.firstName} ${data.lastName}`;
      
      const newUserProfileData: UserProfile = {
        uid: newUser.uid,
        email: newUser.email,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: constructedDisplayName,
        photoURL: null, 
        phoneNumber: data.phoneNumber,
        accountType: data.accountType, // Reverted: Directly use data.accountType
        currency: data.currency,
        kycStatus: "not_started",
        role: data.email === "admin@wohana.com" ? "admin" : "user", 
        balance: initialBalance,
        accountNumber: newAccountNumber,
        isFlagged: false,
        accountHealthScore: 75, 
        profileCompletionPercentage: 50, 
        isSuspended: false,
      };
      await setDoc(userDocRef, newUserProfileData);
      
      setUserProfile(newUserProfileData);
      setUser(newUser as AuthUser);
      
      if (newUser.email) {
        await sendTransactionalEmail({
            recipientEmail: newUser.email,
            emailType: "WELCOME_EMAIL",
            data: { 
                firstName: data.firstName, 
                appName: "Wohana Funds", 
                loginLink: `${window.location.origin}/login`
            }
        });
      }

      setLoading(false);
      return newUser as AuthUser;
    } catch (error: any) {
      setLoading(false);
      throw error; 
    }
  };

  const changeUserPassword = async (data: ChangePasswordFormData): Promise<{ success: boolean; message: string }> => {
    const currentUser = auth.currentUser; 
    if (!currentUser || !currentUser.email) {
      return { success: false, message: "User not authenticated or email missing." };
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, data.currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, data.newPassword);
      setLoading(false);
      return { success: true, message: "Password updated successfully." };
    } catch (error: any) {
      setLoading(false);
      let message = "Failed to change password. Please try again.";
      if (error.code === "auth/wrong-password") {
        message = "Incorrect current password.";
      } else if (error.code === "auth/weak-password") {
        message = "The new password is too weak.";
      } else {
        console.error("Error changing password:", error);
      }
      return { success: false, message };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive" });
      throw error; 
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, changeUserPassword, userProfile, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

    