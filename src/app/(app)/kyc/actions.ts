"use server";

import { kycRiskAssessment, type KycRiskAssessmentInput, type KycRiskAssessmentOutput } from "@/ai/flows/kyc-risk-assessment";
import { z } from "zod";

const KycFormSchema = z.object({
  documentDataUri: z.string().startsWith("data:", { message: "Invalid document data URI" }),
  applicantName: z.string().min(2, { message: "Applicant name must be at least 2 characters" }),
  applicantAddress: z.string().min(5, { message: "Applicant address must be at least 5 characters" }),
});

export type KycFormState = {
  message?: string;
  errors?: {
    documentDataUri?: string[];
    applicantName?: string[];
    applicantAddress?: string[];
    aiError?: string[];
  };
  result?: KycRiskAssessmentOutput;
};

export async function submitKycVerification(
  prevState: KycFormState | undefined,
  formData: FormData
): Promise<KycFormState> {
  const validatedFields = KycFormSchema.safeParse({
    documentDataUri: formData.get("documentDataUri"),
    applicantName: formData.get("applicantName"),
    applicantAddress: formData.get("applicantAddress"),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your inputs.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const inputData: KycRiskAssessmentInput = {
    documentDataUri: validatedFields.data.documentDataUri,
    applicantName: validatedFields.data.applicantName,
    applicantAddress: validatedFields.data.applicantAddress,
  };

  try {
    const result = await kycRiskAssessment(inputData);
    return {
      message: "KYC assessment completed.",
      result,
    };
  } catch (error: any) {
    console.error("AI KYC Risk Assessment Error:", error);
    return {
      message: "AI processing failed.",
      errors: {
        aiError: [error.message || "An unexpected error occurred during AI processing."],
      },
    };
  }
}
