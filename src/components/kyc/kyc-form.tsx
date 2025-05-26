"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitKycVerification, type KycFormState } from "@/app/(app)/kyc/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { KycDocumentInfo } from "@/types";
import Image from "next/image";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Submit for Verification
    </Button>
  );
}

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "application/pdf"];


export function KycVerificationForm() {
  const initialState: KycFormState | undefined = undefined;
  const [formState, formAction] = useFormState(submitKycVerification, initialState);
  const [documentInfo, setDocumentInfo] = useState<KycDocumentInfo | null>(null);
  const [documentDataUri, setDocumentDataUri] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    setDocumentInfo(null);
    setDocumentDataUri(null);
    const file = event.target.files?.[0];

    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError(`Invalid file type. Allowed types: JPG, PNG, PDF.`);
        return;
      }

      setDocumentInfo({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getRiskColor = (score: number): string => {
    if (score < 0.3) return "text-green-600"; // Low risk
    if (score < 0.7) return "text-yellow-600"; // Medium risk
    return "text-red-600"; // High risk
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">KYC Verification</CardTitle>
          <CardDescription>
            Submit your identification document and personal details for verification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div>
              <Label htmlFor="documentUpload" className="mb-2 block text-sm font-medium">Identification Document</Label>
              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm text-muted-foreground">
                    <span className="relative rounded-md font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary hover:text-primary-dark">
                      Upload a file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to {MAX_FILE_SIZE_MB}MB</p>
                </div>
              </div>
              <Input
                id="documentUpload"
                name="documentUpload" // This name is for the input element itself, not directly used by FormData via server action unless explicitly read
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={ALLOWED_FILE_TYPES.join(",")}
              />
              {/* Hidden input to pass data URI to server action */}
              {documentDataUri && <input type="hidden" name="documentDataUri" value={documentDataUri} />}

              {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
              {formState?.errors?.documentDataUri && <p className="mt-2 text-sm text-destructive">{formState.errors.documentDataUri[0]}</p>}
              
              {documentInfo && (
                <div className="mt-4 p-3 border rounded-md bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{documentInfo.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(documentInfo.fileSize / 1024 / 1024).toFixed(2)} MB - {documentInfo.fileType}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantName">Full Name</Label>
              <Input id="applicantName" name="applicantName" placeholder="John Doe" required />
              {formState?.errors?.applicantName && <p className="text-sm text-destructive">{formState.errors.applicantName[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicantAddress">Full Address</Label>
              <Textarea id="applicantAddress" name="applicantAddress" placeholder="123 Main St, Anytown, USA" required />
              {formState?.errors?.applicantAddress && <p className="text-sm text-destructive">{formState.errors.applicantAddress[0]}</p>}
            </div>
            
            <SubmitButton />

            {formState?.message && !formState.errors && !formState.result && (
              <Alert variant={formState.errors ? "destructive" : "default"} className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{formState.errors ? "Error" : "Status"}</AlertTitle>
                <AlertDescription>{formState.message}</AlertDescription>
              </Alert>
            )}
            {formState?.errors?.aiError && (
                <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>AI Processing Error</AlertTitle>
                    <AlertDescription>{formState.errors.aiError[0]}</AlertDescription>
                </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {formState?.result ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              {formState.result.riskScore < 0.3 && <CheckCircle className="h-7 w-7 text-green-500 mr-2" />}
              {formState.result.riskScore >= 0.3 && formState.result.riskScore < 0.7 && <AlertCircle className="h-7 w-7 text-yellow-500 mr-2" />}
              {formState.result.riskScore >= 0.7 && <XCircle className="h-7 w-7 text-red-500 mr-2" />}
              KYC Assessment Result
            </CardTitle>
            <CardDescription>Review the AI-powered risk assessment for the submitted information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Overall Risk Score</Label>
              <p className={`text-3xl font-bold ${getRiskColor(formState.result.riskScore)}`}>
                {formState.result.riskScore.toFixed(2)} / 1.00
              </p>
              <p className="text-xs text-muted-foreground">
                {formState.result.riskScore < 0.3 ? "Low Risk" : formState.result.riskScore < 0.7 ? "Medium Risk" : "High Risk"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Summary</Label>
              <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-md">{formState.result.summary}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Risk Factors Identified</Label>
              {formState.result.riskFactors.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 pl-2 text-sm text-foreground bg-secondary/30 p-3 rounded-md">
                  {formState.result.riskFactors.map((factor, index) => (
                    <li key={index}>{factor}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic p-3 bg-secondary/30 rounded-md">No significant risk factors identified.</p>
              )}
            </div>
             <Image
                src={`https://placehold.co/600x300.png?text=Risk+Score+${formState.result.riskScore.toFixed(2)}`}
                alt="KYC Verification Visual"
                width={600}
                height={300}
                className="mt-4 rounded-md object-cover aspect-video"
                data-ai-hint="identity verification"
            />
          </CardContent>
          <CardFooter>
             <Button onClick={() => {
                // Reset form: clear documentInfo, documentDataUri, and potentially formState by re-triggering action with reset intent or router.refresh()
                setDocumentInfo(null);
                setDocumentDataUri(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                // A more robust reset might involve clearing formState, this is a simple UI reset
                // For a full formState reset, you might need to navigate or use a key prop on the form
                const form = fileInputRef.current?.form;
                form?.reset();
             }} variant="outline">
                Submit Another Document
            </Button>
          </CardFooter>
        </Card>
      ) : (
         <Card className="shadow-lg md:h-full flex flex-col items-center justify-center bg-secondary/20">
          <CardContent className="text-center p-8">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Awaiting Submission</h3>
            <p className="text-muted-foreground">
              Your KYC assessment results will appear here once you submit the form.
            </p>
            <Image 
                src="https://placehold.co/600x400.png"
                alt="KYC process illustration"
                width={600}
                height={400}
                className="mt-6 rounded-md object-cover aspect-video opacity-70"
                data-ai-hint="security privacy"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
