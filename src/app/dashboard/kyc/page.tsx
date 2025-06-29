
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KYCForm } from "./components/kyc-form";
import { useAuth } from "@/hooks/use-auth";
import { fetchKycData } from "@/lib/actions";
import type { KYCData, ClientKYCData, KYCSubmissionResult } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldX, ShieldQuestion, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Timestamp } from "firebase/firestore";

export default function KYCPage() {
  const { user, userProfile } = useAuth();
  const [kycData, setKycData] = useState<KYCData | null>(null); // Stores KYCData with Date objects
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadKycData() {
      if (user?.uid) {
        setIsLoading(true);
        const data = await fetchKycData(user.uid); // fetchKycData returns KYCData with Date objects
        setKycData(data);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }
    loadKycData();
  }, [user]);

  const handleKycSuccess = (result: KYCSubmissionResult) => {
    if (result.kycData) { // result.kycData is ClientKYCData (dates as ISO strings)
        const clientData = result.kycData;
        const processedKycData: KYCData = {
            ...clientData,
            userId: clientData.userId || (user?.uid || ""), // Ensure userId is present
            submittedAt: clientData.submittedAt ? new Date(clientData.submittedAt) : undefined,
            reviewedAt: clientData.reviewedAt ? new Date(clientData.reviewedAt) : undefined,
        };
      setKycData(processedKycData);
    }
  };

  const getStatusBadgeVariant = (status?: KYCData["status"]): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "verified": return "default";
      case "pending_review": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status?: KYCData["status"]) => {
    switch (status) {
      case "verified": return <ShieldCheck className="h-5 w-5 text-green-500" />;
      case "pending_review": return <ShieldQuestion className="h-5 w-5 text-yellow-500" />;
      case "rejected": return <ShieldX className="h-5 w-5 text-red-500" />;
      default: return <ShieldQuestion className="h-5 w-5 text-muted-foreground" />;
    }
  }

  const kycDisplayStatus = kycData?.status?.replace("_", " ") || userProfile?.kycStatus?.replace("_", " ") || "Not Started";

  // formatDate now expects Date object or undefined directly from kycData state
  const formatDate = (dateInput: Date | undefined): string => {
    if (!dateInput) return "N/A";
    if (!(dateInput instanceof Date) || isNaN(dateInput.getTime())) {
        console.warn("formatDate: Received invalid Date object:", dateInput);
        return "Invalid Date";
    }
    return dateInput.toLocaleDateString();
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">KYC Verification</h1>
      <p className="text-muted-foreground">
        Complete your Know Your Customer (KYC) verification to access all platform features.
      </p>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2">Loading KYC status...</p>
        </div>
      )}

      {!isLoading && (
        <>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(kycData?.status || userProfile?.kycStatus)}
                Current KYC Status
              </CardTitle>
              <CardDescription>Your current identity verification status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusBadgeVariant(kycData?.status || userProfile?.kycStatus)} className="text-lg px-3 py-1">
                {kycDisplayStatus.toUpperCase()}
              </Badge>
              {kycData?.submittedAt && (
                <p className="text-sm text-muted-foreground mt-2">
                  Submitted on: {formatDate(kycData.submittedAt as Date)}
                </p>
              )}
              {kycData?.reviewedAt && (
                <p className="text-sm text-muted-foreground">
                  Reviewed on: {formatDate(kycData.reviewedAt as Date)}
                </p>
              )}
               {kycData?.rejectionReason && kycData.status === 'rejected' && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Submission Rejected</AlertTitle>
                  <AlertDescription>
                    Reason: {kycData.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {(kycData?.status === "not_started" || kycData?.status === "rejected" || !kycData) &&
           (!userProfile || userProfile.kycStatus === "not_started" || userProfile.kycStatus === "rejected") && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Submit Your KYC Information</CardTitle>
                <CardDescription>
                  {kycData?.status === "rejected"
                    ? "Your previous KYC submission was rejected. Please review any feedback and resubmit."
                    : "Please fill out the form below to complete your KYC verification."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KYCForm onSuccess={handleKycSuccess} />
              </CardContent>
            </Card>
          )}

          {kycData?.status === "pending_review" && (
             <Alert>
               <ShieldQuestion className="h-4 w-4" />
               <AlertTitle>KYC Under Review</AlertTitle>
               <AlertDescription>
                 Your KYC information has been submitted and is currently under review. We will notify you once the process is complete.
               </AlertDescription>
             </Alert>
          )}

          {kycData?.status === "verified" && (
             <Alert variant="default" className="bg-green-50 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300">
               <ShieldCheck className="h-4 w-4 text-green-500" />
               <AlertTitle className="text-green-700 dark:text-green-300">KYC Verified!</AlertTitle>
               <AlertDescription className="text-green-600 dark:text-green-400">
                 Congratulations! Your identity has been successfully verified.
               </AlertDescription>
             </Alert>
          )}
        </>
      )}
       <Separator className="my-8" />
       <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Why KYC?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-2">
                <p>Know Your Customer (KYC) is a mandatory process for financial institutions to verify the identity of their clients. This helps prevent fraud, money laundering, and other illicit activities.</p>
                <p>By completing KYC, you help us maintain a secure and compliant platform for all users.</p>
            </CardContent>
       </Card>
    </div>
  );
}
