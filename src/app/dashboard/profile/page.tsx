
"use client";

import * as React from "react"; 
import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, UserCircle, ShieldCheck, Wallet, Receipt, Edit3, KeyRound, Mail, Phone, Landmark, Globe, Shapes } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EditProfileDialog } from "./components/edit-profile-dialog"; 
import { ChangePasswordDialog } from "./components/change-password-dialog";
import type { ProfileInfoItemProps } from "@/types";
import { formatCurrency } from "@/lib/utils";

const ProfileInfoItem = ({ icon, label, value }: ProfileInfoItemProps) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium text-muted-foreground flex items-center">
      {icon} {label}
    </Label>
    <p className="text-base font-medium break-words">{value || "N/A"}</p>
  </div>
);

export default function ProfilePage() {
  const { user, userProfile, loading, fetchUserProfile } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [accountTypeName, setAccountTypeName] = useState<string | null>(null);
  const [isLoadingAccountType, setIsLoadingAccountType] = useState(false);

  useEffect(() => {
    async function loadAccountTypeName() {
      if (userProfile?.accountType) {
        setIsLoadingAccountType(true);
        try {
          setAccountTypeName(userProfile.accountType); 
        } catch (error) {
          console.error("Failed to load account type name", error);
          setAccountTypeName("Error loading type");
        } finally {
          setIsLoadingAccountType(false);
        }
      }
    }
    if (userProfile) { 
      loadAccountTypeName();
    }
  }, [userProfile]);


  if (loading && !userProfile) { 
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be logged in to view this page. Please log in and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!userProfile && !loading) { 
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Not Loaded</AlertTitle>
          <AlertDescription>
            We couldn't load your profile details. This might be due to a network issue or an error fetching your data. Please check your internet connection and try refreshing the page. If the problem persists, contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const getInitials = (fName?: string | null, lName?: string | null, email?: string | null) => {
    if (fName && lName) return (fName[0] + lName[0]).toUpperCase();
    const name = userProfile?.displayName; 
    if (name) {
      const names = name.split(' ');
      if (names.length > 1 && names[0] && names[names.length -1]) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0]?.substring(0,2).toUpperCase() || "U";
    }
    if (email) return email[0].toUpperCase();
    return "U";
  }

  const kycStatusDisplay = {
    not_started: "Not Started",
    pending_review: "Pending Review",
    verified: "Verified",
    rejected: "Rejected",
  };

  const handleProfileUpdateSuccess = () => {
    setIsEditProfileOpen(false);
    if(user?.uid) fetchUserProfile(user.uid); 
  };

  const handleChangePasswordSuccess = () => {
    setIsChangePasswordOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <div className="flex gap-2">
            <Button onClick={() => setIsEditProfileOpen(true)} disabled={!userProfile}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
            <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)} disabled={!userProfile}>
                <KeyRound className="mr-2 h-4 w-4" /> Change Password
            </Button>
        </div>
      </div>
      
      {userProfile ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userProfile.photoURL || ""} alt={userProfile.displayName || userProfile.email || ""} />
                <AvatarFallback className="text-3xl">{getInitials(userProfile.firstName, userProfile.lastName, userProfile.email)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{userProfile.displayName || "Not Set"}</h2>
                <p className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {userProfile.email}</p>
                {userProfile.phoneNumber && (
                  <p className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {userProfile.phoneNumber}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-y-4 gap-x-6 md:grid-cols-2 lg:grid-cols-3">
              <ProfileInfoItem icon={<UserCircle className="h-4 w-4 mr-2 text-primary" />} label="User ID" value={userProfile.uid} />
              <ProfileInfoItem icon={<ShieldCheck className="h-4 w-4 mr-2 text-primary" />} label="KYC Status" value={kycStatusDisplay[userProfile.kycStatus || "not_started"]} />
              <ProfileInfoItem 
                icon={<Shapes className="h-4 w-4 mr-2 text-primary" />} 
                label="Account Type" 
                value={isLoadingAccountType ? "Loading..." : (accountTypeName || userProfile.accountType || "N/A")} 
              />
              <ProfileInfoItem icon={<Receipt className="h-4 w-4 mr-2 text-primary" />} label="Account Number" value={userProfile.accountNumber} />
              <ProfileInfoItem icon={<Wallet className="h-4 w-4 mr-2 text-primary" />} label="Account Balance" value={formatCurrency(userProfile.balance, userProfile.primaryCurrency)} />
              <ProfileInfoItem icon={<Globe className="h-4 w-4 mr-2 text-primary" />} label="Preferred Currency" value={userProfile.primaryCurrency} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
           <CardHeader>
            <CardTitle>Profile Data</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && user && (
                 <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                     <p className="ml-2">Loading profile data...</p>
                 </div>
            )}
            {!loading && !userProfile && user && (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Profile</AlertTitle>
                    <AlertDescription>
                        Could not load your profile information. Please try refreshing or contact support if the issue persists.
                    </AlertDescription>
                 </Alert>
            )}
          </CardContent>
        </Card>
      )}
      

      {isEditProfileOpen && userProfile && (
        <EditProfileDialog
          isOpen={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          userProfile={userProfile}
          onSuccess={handleProfileUpdateSuccess}
        />
      )}

      {isChangePasswordOpen && userProfile && ( 
        <ChangePasswordDialog
          isOpen={isChangePasswordOpen}
          onOpenChange={setIsChangePasswordOpen}
          onSuccess={handleChangePasswordSuccess}
        />
      )}

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account preferences and security.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Advanced account settings will be available here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
