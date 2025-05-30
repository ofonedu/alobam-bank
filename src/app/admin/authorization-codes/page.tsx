
// src/app/admin/authorization-codes/page.tsx
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Trash2, Loader2, AlertTriangle, Info, KeyRound, Copy, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateAuthorizationCodeAction, getAuthorizationCodesAction, deleteAuthorizationCodeAction } from "@/lib/actions/admin-code-actions";
import type { AuthorizationCode as OriginalAuthorizationCode } from "@/types"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"; // Added import

interface ClientAuthorizationCode extends Omit<OriginalAuthorizationCode, 'createdAt' | 'expiresAt'> {
    createdAt: Date;
    expiresAt?: Date;
}

const formatDateDisplay = (dateInput: Date | undefined): string => {
    if (!dateInput) return "N/A";
    return dateInput.toLocaleString();
  };

export default function AuthorizationCodesPage() {
  const { toast } = useToast();
  
  const [codeType, setCodeType] = useState<'COT' | 'IMF' | 'TAX'>('COT');
  const [targetUserId, setTargetUserId] = useState(""); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [codes, setCodes] = useState<ClientAuthorizationCode[]>([]); 
  const [isLoadingCodes, setIsLoadingCodes] = useState(true);
  const [fetchCodesError, setFetchCodesError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  async function fetchCodes() {
    setIsLoadingCodes(true);
    setFetchCodesError(null);
    try {
      const result = await getAuthorizationCodesAction(); 
      if (result.success && result.codes) {
        setCodes(result.codes.map(code => ({
          ...code, 
          createdAt: new Date(code.createdAt), 
          expiresAt: code.expiresAt ? new Date(code.expiresAt) : undefined, 
        })));
      } else {
        setFetchCodesError(result.error || "Failed to load authorization codes.");
      }
    } catch (error: any) {
      setFetchCodesError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingCodes(false);
    }
  }

  useEffect(() => {
    fetchCodes();
  }, []);

  const handleGenerateCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);

    const result = await generateAuthorizationCodeAction(codeType, targetUserId || undefined);

    if (result.success && result.code) {
      toast({ 
        title: "Code Generated", 
        description: `New ${result.code.type} code: ${result.code.value}`,
        duration: 10000, 
      });
      await fetchCodes(); 
      setTargetUserId(""); 
    } else {
      setGenerationError(result.error || "Failed to generate code.");
      toast({ title: "Error", description: result.error || "Failed to generate code.", variant: "destructive" });
    }
    setIsGenerating(false);
  };
  
  const handleDeleteCode = async (codeId: string) => {
    setIsDeleting(codeId);
    const result = await deleteAuthorizationCodeAction(codeId);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      await fetchCodes();
    } else {
      toast({ title: "Error", description: result.message || "Failed to delete code.", variant: "destructive" });
    }
    setIsDeleting(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: "Code copied to clipboard." });
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy code.", variant: "destructive"});
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center"><KeyRound className="mr-2 h-8 w-8 text-primary" />Manage Authorization Codes</h1>
        <p className="text-muted-foreground">Generate, view, and manage COT, IMF, and Tax Clearance codes for user transactions.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Generate New Authorization Code</CardTitle>
          <CardDescription>Select code type and optionally assign to a user. Codes are stored in Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerateCode} className="space-y-4">
            {generationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Generation Error</AlertTitle>
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="codeType">Code Type</Label>
                    <Select value={codeType} onValueChange={(value) => setCodeType(value as 'COT' | 'IMF' | 'TAX')}>
                        <SelectTrigger id="codeType">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="COT">COT (Cost of Transfer)</SelectItem>
                            <SelectItem value="IMF">IMF (Monetary Fund)</SelectItem>
                            <SelectItem value="TAX">Tax Clearance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="targetUserId">Target User ID (Optional)</Label>
                    <Input
                        id="targetUserId"
                        name="targetUserId"
                        value={targetUserId}
                        onChange={(e) => setTargetUserId(e.target.value)}
                        placeholder="Enter User ID if code is user-specific"
                    />
                </div>
            </div>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              Generate Code
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Authorization Codes</CardTitle>
          <CardDescription>List of generated codes from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCodes && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading codes...</p>
            </div>
          )}
          {fetchCodesError && !isLoadingCodes && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Codes</AlertTitle>
              <AlertDescription>{fetchCodesError}</AlertDescription>
            </Alert>
          )}
          {!isLoadingCodes && !fetchCodesError && codes.length === 0 && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Authorization Codes Found</AlertTitle>
                <AlertDescription>There are no codes generated yet. Use the form above to create one.</AlertDescription>
            </Alert>
          )}
          {!isLoadingCodes && !fetchCodesError && codes.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code Value</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono text-xs flex items-center gap-2">
                        {code.value}
                        <Button variant="ghost" size="icon" title="Copy Code" onClick={() => copyToClipboard(code.value)} className="h-6 w-6">
                            <Copy className="h-3 w-3"/>
                        </Button>
                    </TableCell>
                    <TableCell>{code.type}</TableCell>
                    <TableCell>{code.userId || "N/A (Global)"}</TableCell>
                    <TableCell>{formatDateDisplay(code.createdAt)}</TableCell>
                    <TableCell>{formatDateDisplay(code.expiresAt) || "N/A"}</TableCell>
                    <TableCell>
                        {code.isUsed ? (
                            <Badge variant="outline" className="text-muted-foreground">
                                <XCircle className="mr-1 h-3 w-3 text-destructive" /> Used
                            </Badge>
                        ) : (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                                <CheckCircle className="mr-1 h-3 w-3" /> Active
                            </Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Delete Code" onClick={() => handleDeleteCode(code.id)} disabled={isDeleting === code.id} className="text-destructive hover:text-destructive/90">
                         {isDeleting === code.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

