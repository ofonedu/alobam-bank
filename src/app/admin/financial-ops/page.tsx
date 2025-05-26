
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, TrendingUp, TrendingDown, History, Users, FilePlus, FileMinus, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { issueManualAdjustmentAction, generateRandomTransactionsAction } from "@/lib/actions/admin-actions";

export default function AdminFinancialOpsPage() {
  const { toast } = useToast();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // State for Manual Charge/Credit
  const [selectedUserIdCharge, setSelectedUserIdCharge] = useState<string>('');
  const [amountCharge, setAmountCharge] = useState<string>('');
  const [chargeType, setChargeType] = useState<'credit' | 'debit'>('debit');
  const [descriptionCharge, setDescriptionCharge] = useState<string>('');
  const [isIssuingCharge, setIsIssuingCharge] = useState(false);

  // State for Generate History
  const [selectedUserIdHistory, setSelectedUserIdHistory] = useState<string>('');
  const [numTransactions, setNumTransactions] = useState<string>('5');
  const [isGeneratingHistory, setIsGeneratingHistory] = useState(false);

  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersCollectionRef = collection(db, "users");
        const querySnapshot = await getDocs(usersCollectionRef);
        const fetchedUsers: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          fetchedUsers.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        setAllUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users for admin ops:", error);
        toast({ title: "Error", description: "Failed to load user list.", variant: "destructive" });
      }
      setIsLoadingUsers(false);
    };
    fetchAllUsers();
  }, [toast]);

  const handleIssueCharge = async () => {
    if (!selectedUserIdCharge || !amountCharge || !descriptionCharge) {
      toast({ title: "Missing Information", description: "Please select a user, enter an amount, and provide a description.", variant: "destructive" });
      return;
    }
    setIsIssuingCharge(true);
    const result = await issueManualAdjustmentAction(
      selectedUserIdCharge,
      parseFloat(amountCharge),
      chargeType,
      descriptionCharge
    );
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setSelectedUserIdCharge('');
      setAmountCharge('');
      setDescriptionCharge('');
    } else {
      toast({ title: "Failed", description: result.message || "Could not process adjustment.", variant: "destructive" });
    }
    setIsIssuingCharge(false);
  };

  const handleGenerateHistory = async () => {
    if (!selectedUserIdHistory || !numTransactions || parseInt(numTransactions) <= 0) {
      toast({ title: "Missing Information", description: "Please select a user and enter a valid number of transactions.", variant: "destructive" });
      return;
    }
    setIsGeneratingHistory(true);
    const result = await generateRandomTransactionsAction(selectedUserIdHistory, parseInt(numTransactions));
    if (result.success) {
      toast({ title: "Success", description: result.message });
      setSelectedUserIdHistory('');
      setNumTransactions('5');
    } else {
      toast({ title: "Failed", description: result.message || "Could not generate history.", variant: "destructive" });
    }
    setIsGeneratingHistory(false);
  };


  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center"><DollarSign className="mr-2 h-8 w-8 text-primary" />Financial Operations</h1>
        <p className="text-muted-foreground">Manually issue charges, credits, and manage other financial tasks.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
                {chargeType === 'credit' ? <FilePlus className="mr-2 h-5 w-5 text-green-500" /> : <FileMinus className="mr-2 h-5 w-5 text-red-500" />}
                Issue Manual Charge / Credit
            </CardTitle>
            <CardDescription>Apply a manual debit (charge) or credit to a user's account. This will affect their balance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userSelectCharge">Select User</Label>
              <Select value={selectedUserIdCharge} onValueChange={setSelectedUserIdCharge} disabled={isLoadingUsers || isIssuingCharge}>
                <SelectTrigger id="userSelectCharge">
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user..."} />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                    <SelectItem key={user.uid} value={user.uid}>{user.displayName || user.email} ({user.uid.substring(0,6)}...)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="amountCharge">Amount</Label>
                    <Input 
                        id="amountCharge" 
                        type="number" 
                        placeholder="e.g., 25.00" 
                        value={amountCharge}
                        onChange={(e) => setAmountCharge(e.target.value)}
                        disabled={isIssuingCharge}
                    />
                </div>
                <div>
                    <Label htmlFor="chargeType">Type</Label>
                     <Select value={chargeType} onValueChange={(value) => setChargeType(value as 'credit' | 'debit')} disabled={isIssuingCharge}>
                        <SelectTrigger id="chargeType">
                        <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="debit">Debit (Charge User)</SelectItem>
                        <SelectItem value="credit">Credit (Fund User)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div>
              <Label htmlFor="descriptionCharge">Description / Reason</Label>
              <Textarea 
                id="descriptionCharge" 
                placeholder="e.g., Monthly maintenance fee, Bonus credit" 
                value={descriptionCharge}
                onChange={(e) => setDescriptionCharge(e.target.value)}
                disabled={isIssuingCharge}
                rows={3}
              />
            </div>
            <Button onClick={handleIssueCharge} disabled={!selectedUserIdCharge || !amountCharge || !descriptionCharge || isIssuingCharge}>
              {isIssuingCharge ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (chargeType === 'credit' ? <TrendingUp className="mr-2 h-4 w-4" /> : <TrendingDown className="mr-2 h-4 w-4" />)}
              {chargeType === 'credit' ? 'Issue Credit' : 'Apply Charge'}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><History className="mr-2 h-5 w-5" />Generate Random Transaction History</CardTitle>
            <CardDescription>For testing purposes, generate random transaction history for a user. This action now also updates the user's account balance accordingly.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="userSelectHistory">Select User</Label>
               <Select value={selectedUserIdHistory} onValueChange={setSelectedUserIdHistory} disabled={isLoadingUsers || isGeneratingHistory}>
                <SelectTrigger id="userSelectHistory">
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user..."} />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(user => (
                     <SelectItem key={user.uid} value={user.uid}>{user.displayName || user.email} ({user.uid.substring(0,6)}...)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="numTransactions">Number of Transactions</Label>
              <Input 
                id="numTransactions" 
                type="number" 
                placeholder="e.g., 5" 
                value={numTransactions}
                onChange={(e) => setNumTransactions(e.target.value)}
                min="1"
                max="50"
                disabled={isGeneratingHistory}
              />
            </div>
            <Button onClick={handleGenerateHistory} disabled={!selectedUserIdHistory || !numTransactions || parseInt(numTransactions) <=0 || isGeneratingHistory}>
              {isGeneratingHistory ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
              Generate History & Update Balance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
