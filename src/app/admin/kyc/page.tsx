
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Loader2, AlertTriangle } from "lucide-react";
import type { AdminKYCView, KYCData, UserProfile } from "@/types";
import { collection, getDocs, Timestamp, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { KYCDetailModal } from "./components/KYCDetailModal";

const KYCStatusBadge = ({ status }: { status: AdminKYCView["status"] }) => {
  switch (status) {
    case "verified": return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Verified</Badge>;
    case "pending_review": return <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">Pending Review</Badge>;
    case "rejected": return <Badge variant="destructive">Rejected</Badge>;
    case "not_started": return <Badge variant="outline">Not Started</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminKycPage() {
  const [kycSubmissions, setKycSubmissions] = useState<AdminKYCView[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKycItem, setSelectedKycItem] = useState<AdminKYCView | null>(null);

  const fetchKycSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const kycCollectionRef = collection(db, "kycData");
      const q = query(kycCollectionRef, orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedSubmissionsPromises = querySnapshot.docs.map(async (kycDoc) => {
        const rawData = kycDoc.data();
        let userEmail: string | undefined;
        const userId = rawData.userId;

        if (userId) {
          try {
            const userDocRef = doc(db, "users", userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              userEmail = (userDocSnap.data() as UserProfile).email || undefined;
            }
          } catch (userError) {
            console.warn(`Failed to fetch user profile for KYC item ${kycDoc.id}:`, userError);
          }
        }

        let submittedAtDate: Date;
        if (rawData.submittedAt) {
          if ((rawData.submittedAt as Timestamp)?.toDate && typeof (rawData.submittedAt as Timestamp).toDate === 'function') {
            submittedAtDate = (rawData.submittedAt as Timestamp).toDate();
          } else if (rawData.submittedAt instanceof Date) {
            submittedAtDate = rawData.submittedAt;
          } else {
            try {
              const parsedDate = new Date(rawData.submittedAt as string | number);
              if (!isNaN(parsedDate.getTime())) {
                submittedAtDate = parsedDate;
              } else {
                console.warn(`KYC item ${kycDoc.id} has invalid submittedAt format:`, rawData.submittedAt);
                submittedAtDate = new Date(); // Fallback
              }
            } catch {
              console.warn(`KYC item ${kycDoc.id} failed to parse submittedAt:`, rawData.submittedAt);
              submittedAtDate = new Date(); // Fallback
            }
          }
        } else {
          console.warn(`KYC item ${kycDoc.id} missing submittedAt, using current date as fallback.`);
          submittedAtDate = new Date(); // Fallback for missing submittedAt
        }

        let reviewedAtDate: Date | undefined;
        if (rawData.reviewedAt) {
          if ((rawData.reviewedAt as Timestamp)?.toDate && typeof (rawData.reviewedAt as Timestamp).toDate === 'function') {
            reviewedAtDate = (rawData.reviewedAt as Timestamp).toDate();
          } else if (rawData.reviewedAt instanceof Date) {
            reviewedAtDate = rawData.reviewedAt;
          } else {
             try {
              const parsedDate = new Date(rawData.reviewedAt as string | number);
              if (!isNaN(parsedDate.getTime())) {
                reviewedAtDate = parsedDate;
              } else {
                reviewedAtDate = undefined;
              }
            } catch {
              reviewedAtDate = undefined;
            }
          }
        }
        
        // Constructing the item ensuring all fields match KYCData & AdminKYCView
        const kycDataItem: KYCData = {
          userId: rawData.userId || kycDoc.id, // kycDoc.id can be used as fallback if userId is missing from data
          fullName: rawData.fullName || "",
          dateOfBirth: rawData.dateOfBirth || "",
          address: rawData.address || "",
          governmentId: rawData.governmentId || "",
          photoUrl: rawData.photoUrl, // This will be undefined if not present
          photoFileName: rawData.photoFileName, // Undefined if not present
          status: rawData.status || "not_started",
          submittedAt: submittedAtDate, // Now definitely a Date
          reviewedAt: reviewedAtDate, // Date or undefined
          reviewedBy: rawData.reviewedBy, // Undefined if not present
          rejectionReason: rawData.rejectionReason, // Undefined if not present
        };

        return {
          ...kycDataItem,
          id: kycDoc.id, 
          userEmail: userEmail,
        } as AdminKYCView;
      });

      const fetchedSubmissions = await Promise.all(fetchedSubmissionsPromises);
      setKycSubmissions(fetchedSubmissions);

    } catch (err: any) {
      console.error("Error fetching KYC submissions:", err);
      setError("Failed to fetch KYC submissions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycSubmissions();
  }, []);

  const handleReviewKyc = (kycItem: AdminKYCView) => {
    setSelectedKycItem(kycItem);
    setIsModalOpen(true);
  };

  const handleModalActionComplete = () => {
    fetchKycSubmissions(); 
  };

  const filteredSubmissions = kycSubmissions.filter(item =>
    item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">KYC Review</h1>
            <p className="text-muted-foreground">Review and process pending KYC submissions.</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>KYC Submissions ({isLoading ? "Loading..." : filteredSubmissions.length})</CardTitle>
          <CardDescription>Review user-submitted KYC documents.</CardDescription>
           <div className="pt-4 flex gap-2">
             <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, user ID, email..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading KYC submissions...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Submissions</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredSubmissions.length === 0 && !searchTerm ? (
            <p className="text-muted-foreground text-center py-8">No KYC submissions found.</p>
          ) : filteredSubmissions.length === 0 && searchTerm ? (
             <p className="text-muted-foreground text-center py-8">No submissions match your search for "{searchTerm}".</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.userId}</TableCell>
                    <TableCell>{item.fullName}</TableCell>
                    <TableCell>{item.userEmail || 'N/A'}</TableCell>
                    <TableCell>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><KYCStatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" onClick={() => handleReviewKyc(item)}>
                        <Eye className="mr-2 h-4 w-4" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedKycItem && (
        <KYCDetailModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          kycItem={selectedKycItem}
          onActionComplete={handleModalActionComplete}
        />
      )}
    </div>
  );
}
    

    
