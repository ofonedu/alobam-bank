
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
  updatePassword,
  deleteUser
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { type UserProfile, type AuthUser } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { z } from "zod";
import type { AuthSchema, RegisterFormData, ChangePasswordFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { sendTransactionalEmail, getEmailTemplateAndSubject } from "@/lib/email-service";
import { getPlatformSettingsAction } from "@/lib/actions/admin-settings-actions"; // For fetching settings

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
        const data = userDoc.data() as Partial<UserProfile>;
        const fetchedBalance = typeof data.balance === 'number' ? data.balance : 0;
        const fetchedPrimaryCurrency = data.primaryCurrency || "USD";

        setUserProfile({
          ...data,
          uid,
          balance: fetchedBalance,
          primaryCurrency: fetchedPrimaryCurrency,
        } as UserProfile);
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
    console.log(`signIn: Attempting Firebase sign-in for: ${data.email}`);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      console.log(`signIn: Firebase sign-in successful for UID: ${firebaseUser.uid}`);

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      let tempProfile: UserProfile | null = null;
      if (userDoc.exists()) {
          const profileData = userDoc.data() as Partial<UserProfile>;
          tempProfile = {
              ...profileData,
              uid: firebaseUser.uid,
              balance: typeof profileData.balance === 'number' ? profileData.balance : 0,
              primaryCurrency: profileData.primaryCurrency || "USD",
          } as UserProfile;
          setUserProfile(tempProfile);
      }

      if (tempProfile?.isSuspended) {
          await firebaseSignOut(auth);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          console.warn(`signIn: User ${data.email} (UID: ${firebaseUser.uid}) is suspended. Denying login.`);
          throw { code: 'auth/user-disabled', message: 'Your account has been suspended. Please contact support.' };
      }

      setUser(firebaseUser as AuthUser);
      setLoading(false);
      return firebaseUser as AuthUser;
    } catch (error: any) {
      setLoading(false);
      console.error(`signIn: Error during Firebase sign-in for ${data.email}:`, error.code, error.message);
      throw error;
    }
  };

  const signUp = async (data: RegisterFormData) => {
    setLoading(true);
    let newUser: FirebaseUser | null = null;
    try {
      console.log("signUp: Attempting to create Firebase Auth user for:", data.email);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      newUser = userCredential.user;
      console.log("signUp: Firebase Auth user created successfully. UID:", newUser.uid);

      const userDocRef = doc(db, "users", newUser.uid);
      const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const constructedDisplayName = `${data.firstName} ${data.lastName}`;
      const primaryCurrency = data.currency || "USD";

      const newUserProfileData: UserProfile = {
        uid: newUser.uid,
        email: newUser.email,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: constructedDisplayName,
        photoURL: null,
        phoneNumber: data.phoneNumber || undefined,
        accountType: data.accountType || "user_default_type",
        balance: 0,
        primaryCurrency: primaryCurrency,
        kycStatus: "not_started",
        role: data.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? "admin" : "user",
        accountNumber: newAccountNumber,
        isFlagged: false,
        accountHealthScore: 75,
        profileCompletionPercentage: 50,
        isSuspended: false,
      };

      try {
        console.log("signUp: Attempting to create Firestore profile for UID:", newUser.uid, newUserProfileData);
        await setDoc(userDocRef, newUserProfileData);
        console.log("signUp: Firestore profile created successfully for UID:", newUser.uid);
      } catch (firestoreError: any) {
        console.error("signUp: CRITICAL - Failed to create Firestore profile for UID:", newUser.uid, firestoreError);
        if (newUser) {
          console.warn("signUp: Attempting to delete Firebase Auth user due to Firestore profile creation failure. UID:", newUser.uid);
          try {
            await deleteUser(newUser);
            console.log("signUp: Firebase Auth user deleted successfully after Firestore failure. UID:", newUser.uid);
          } catch (deleteError: any) {
            console.error("signUp: CRITICAL - Failed to delete Firebase Auth user after Firestore failure. Orphaned Auth user may exist. UID:", newUser.uid, deleteError);
          }
        }
        throw firestoreError;
      }

      setUserProfile(newUserProfileData);
      setUser(newUser as AuthUser);
      setLoading(false);

      // Send welcome email
      if (newUser.email) {
        console.log(`signUp: Preparing to send welcome email to: ${newUser.email}`);
        // Fetch platform settings to get bankName and emailLogoImageUrl
        const settingsResult = await getPlatformSettingsAction();
        const bankName = settingsResult.settings?.platformName || "Wohana Funds";
        const emailLogoImageUrl = settingsResult.settings?.emailLogoImageUrl;

        const emailPayload = {
          fullName: constructedDisplayName || "Valued User",
          bankName: bankName,
          emailLogoImageUrl: emailLogoImageUrl,
          accountNumber: newAccountNumber,
          loginLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard`,
        };

        try {
          const emailContent = await getEmailTemplateAndSubject("WELCOME", emailPayload);

          if (emailContent.html) {
            console.log(`signUp: Attempting to send welcome email. Subject: "${emailContent.subject}"`);
            sendTransactionalEmail({
              to: newUser.email,
              subject: emailContent.subject,
              htmlBody: emailContent.html,
              textBody: `Welcome to ${bankName}, ${emailPayload.fullName}! Your account is ready. Login at ${emailPayload.loginLink}`
            })
              .then(emailResult => {
                if (emailResult.success) {
                  console.log(`Welcome email sent successfully to: ${newUser.email}. Message: ${emailResult.message}`);
                } else {
                  console.error(`Failed to send welcome email to ${newUser.email}: ${emailResult.message}`, emailResult.error);
                }
              })
              .catch(emailError => {
                console.error(`Exception sending welcome email to ${newUser.email}:`, emailError);
              });
          } else {
              console.warn(`signUp: Welcome email HTML template not found for type "WELCOME".`);
          }
        } catch (emailError: any) {
            console.error(`Exception preparing welcome email content for ${newUser.email}:`, emailError.message, emailError);
        }
      } else {
        console.warn("signUp: New user has no email, cannot send welcome email. UID:", newUser.uid);
      }

      return newUser as AuthUser;
    } catch (error: any) {
      setLoading(false);
      console.error("signUp: Overall signup error for:", data.email, error.code, error.message);
      if (newUser && error.code !== 'auth/email-already-in-use' && !error.message.includes("Firestore")) {
         console.warn("signUp: Attempting to delete Firebase Auth user due to an error after creation but before Firestore (or non-Firestore error). UID:", newUser.uid);
         try {
            await deleteUser(newUser);
            console.log("signUp: Firebase Auth user deleted successfully due to post-creation error. UID:", newUser.uid);
          } catch (deleteError: any) {
            console.error("signUp: CRITICAL - Failed to delete Firebase Auth user. Orphaned Auth user may exist. UID:", newUser.uid, deleteError);
          }
      }
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
