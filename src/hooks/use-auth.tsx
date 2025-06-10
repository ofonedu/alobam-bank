
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
  deleteUser as deleteAuthUser, 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, AuthUser } from "@/types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { z } from "zod";
import type { AuthSchema, RegisterFormData, ChangePasswordFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { sendTransactionalEmail, getEmailTemplateAndSubject } from "@/lib/email-service";
import { getPlatformSettingsAction } from "@/lib/actions/admin-settings-actions";

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

      // Fetch profile immediately after successful Firebase auth
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      let tempProfile: UserProfile | null = null; // tempProfile for immediate use

      if (userDoc.exists()) {
          const profileData = userDoc.data() as Partial<UserProfile>;
          tempProfile = {
              ...profileData,
              uid: firebaseUser.uid, // Ensure uid is set from firebaseUser
              balance: typeof profileData.balance === 'number' ? profileData.balance : 0,
              primaryCurrency: profileData.primaryCurrency || "USD",
          } as UserProfile;
          setUserProfile(tempProfile); // Update global userProfile state
      } else {
          console.warn(`signIn: User profile document not found for UID: ${firebaseUser.uid} immediately after login. This is unexpected for an existing user.`);
          // If profile doesn't exist for some reason, we might still allow login,
          // but features relying on userProfile might not work.
          // Or, one could throw an error here if a profile is strictly required.
      }

      // No longer blocking login for suspended accounts here
      // if (tempProfile?.isSuspended) {
      //     await firebaseSignOut(auth);
      //     setUser(null);
      //     setUserProfile(null);
      //     setLoading(false);
      //     console.warn(`signIn: User ${data.email} (UID: ${firebaseUser.uid}) is suspended. Denying login.`);
      //     throw { code: 'auth/user-disabled', message: 'Your account has been suspended. Please contact support.' };
      // }

      setUser(firebaseUser as AuthUser); // Update global user state
      setLoading(false);
      return firebaseUser as AuthUser;
    } catch (error: any) {
      setLoading(false);
      console.error(`signIn: Error during Firebase sign-in for ${data.email}:`, error.code, error.message);
      throw error; // Re-throw to be caught by the calling component
    }
  };

  const signUp = async (data: RegisterFormData) => {
    setLoading(true);
    let newAuthUser: FirebaseUser | null = null; 
    try {
      console.log("signUp: Attempting to create Firebase Auth user for:", data.email);
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      newAuthUser = userCredential.user;
      console.log("signUp: Firebase Auth user created successfully. UID:", newAuthUser.uid);

      const userDocRef = doc(db, "users", newAuthUser.uid);
      const newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const constructedDisplayName = `${data.firstName} ${data.lastName}`;
      const primaryCurrency = data.currency || "USD";

      const newUserProfileData: UserProfile = {
        uid: newAuthUser.uid,
        email: newAuthUser.email,
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
        console.log("signUp: Attempting to create Firestore profile for UID:", newAuthUser.uid, newUserProfileData);
        await setDoc(userDocRef, newUserProfileData);
        console.log("signUp: Firestore profile created successfully for UID:", newAuthUser.uid);
      } catch (firestoreError: any) {
        console.error("signUp: CRITICAL - Failed to create Firestore profile for UID:", newAuthUser.uid, firestoreError);
        if (newAuthUser) {
          console.warn("signUp: Attempting to delete Firebase Auth user due to Firestore profile creation failure. UID:", newAuthUser.uid);
          try {
            await deleteAuthUser(newAuthUser); 
            console.log("signUp: Firebase Auth user deleted successfully after Firestore failure. UID:", newAuthUser.uid);
          } catch (deleteError: any) {
            console.error("signUp: CRITICAL - Failed to delete Firebase Auth user after Firestore failure. Orphaned Auth user may exist. UID:", newAuthUser.uid, deleteError);
          }
        }
        throw firestoreError;
      }

      setUserProfile(newUserProfileData);
      setUser(newAuthUser as AuthUser);
      setLoading(false);

      if (newAuthUser.email) {
        console.log(`signUp: Preparing to send welcome email to: ${newAuthUser.email}`);
        const settingsResult = await getPlatformSettingsAction();
        
        const emailPayload = {
          fullName: constructedDisplayName || "Valued User",
          bankName: settingsResult.settings?.platformName || "Wohana Funds",
          emailLogoImageUrl: settingsResult.settings?.emailLogoImageUrl,
          accountNumber: newAccountNumber,
          loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard`,
          supportEmail: settingsResult.settings?.supportEmail,
        };
        console.log("signUp: Email payload for template:", emailPayload);

        try {
          const emailContent = await getEmailTemplateAndSubject("WELCOME", emailPayload); 

          if (emailContent.html) {
            console.log(`signUp: Attempting to send welcome email. Subject: "${emailContent.subject}"`);
            sendTransactionalEmail({
              to: newAuthUser.email,
              subject: emailContent.subject,
              htmlBody: emailContent.html,
              textBody: `Welcome to ${emailPayload.bankName}, ${emailPayload.fullName}! Your account is ready. Account Number: ${emailPayload.accountNumber}. Login at ${emailPayload.loginUrl}`
            })
              .then(emailResult => {
                if (emailResult.success) {
                  console.log(`signUp: Welcome email sent successfully to: ${newAuthUser.email}. Message: ${emailResult.message}`);
                } else {
                  console.error(`signUp: Failed to send welcome email to ${newAuthUser.email}: ${emailResult.message}`, emailResult.error);
                }
              })
              .catch(emailError => {
                console.error(`signUp: Exception sending welcome email to ${newAuthUser.email}:`, emailError);
              });
          } else {
              console.warn(`signUp: Welcome email HTML content was null or empty for type "WELCOME".`);
          }
        } catch (emailError: any) {
            console.error(`signUp: Exception preparing welcome email content for ${newAuthUser.email}:`, emailError.message, JSON.stringify(emailError, Object.getOwnPropertyNames(emailError)));
        }
      } else {
        console.warn("signUp: New user has no email, cannot send welcome email. UID:", newAuthUser.uid);
      }

      return newAuthUser as AuthUser;
    } catch (error: any) {
      setLoading(false);
      console.error("signUp: CLIENT-SIDE CAUGHT ERROR during overall signup for:", data.email, "Error Code:", error.code, "Error Message:", error.message, "Full Error:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      if (newAuthUser && error.code !== 'auth/email-already-in-use' && !error.message?.includes("Firestore")) {
         console.warn("signUp: Attempting to delete Firebase Auth user due to an error after creation but before Firestore (or non-Firestore error). UID:", newAuthUser.uid);
         try {
            await deleteAuthUser(newAuthUser); 
            console.log("signUp: Firebase Auth user deleted successfully due to post-creation error. UID:", newAuthUser.uid);
          } catch (deleteError: any) {
            console.error("signUp: CRITICAL - Failed to delete Firebase Auth user. Orphaned Auth user may exist. UID:", newAuthUser.uid, deleteError);
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

      // Send Password Changed Notification
      const settingsResult = await getPlatformSettingsAction();
      const emailPayload = {
        fullName: userProfile?.displayName || currentUser.displayName || "Valued User",
        bankName: settingsResult.settings?.platformName || "Wohana Funds",
        emailLogoImageUrl: settingsResult.settings?.emailLogoImageUrl,
        loginUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/dashboard`,
        passwordChangedDate: new Date().toISOString(),
        supportEmail: settingsResult.settings?.supportEmail,
      };

      try {
        const emailContent = await getEmailTemplateAndSubject("PASSWORD_CHANGED", emailPayload);
        if (emailContent.html) {
          sendTransactionalEmail({
            to: currentUser.email,
            subject: emailContent.subject,
            htmlBody: emailContent.html,
            textBody: `Your password for ${emailPayload.bankName} was successfully changed on ${new Date(emailPayload.passwordChangedDate).toLocaleDateString()}. If you did not make this change, please contact support immediately.`,
          }).then(emailResult => {
            if (!emailResult.success) console.error("Failed to send password changed email:", emailResult.error);
            else console.log("Password changed email sent successfully.");
          });
        }
      } catch (emailError: any) {
        console.error("Error preparing/sending password changed email:", emailError.message);
      }

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

    