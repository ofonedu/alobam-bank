// KYC risk assessment flow to analyze documents and provide a risk score.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview AI-enhanced KYC (Know Your Customer) risk assessment flow.
 *
 * - kycRiskAssessment - A function that processes KYC documents and returns a risk assessment.
 * - KycRiskAssessmentInput - The input type for the kycRiskAssessment function.
 * - KycRiskAssessmentOutput - The return type for the kycRiskAssessment function.
 */

const KycRiskAssessmentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "A KYC document, such as a driver's license or passport, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  applicantName: z.string().describe('The name of the applicant.'),
  applicantAddress: z.string().describe('The address of the applicant.'),
});
export type KycRiskAssessmentInput = z.infer<typeof KycRiskAssessmentInputSchema>;

const KycRiskAssessmentOutputSchema = z.object({
  riskScore: z
    .number()
    .describe(
      'A risk score from 0 to 1, where 0 indicates very low risk and 1 indicates very high risk.'
    ),
  riskFactors: z
    .array(z.string())
    .describe('A list of factors contributing to the risk score.'),
  summary: z.string().describe('A summary of the risk assessment.'),
});
export type KycRiskAssessmentOutput = z.infer<typeof KycRiskAssessmentOutputSchema>;

export async function kycRiskAssessment(
  input: KycRiskAssessmentInput
): Promise<KycRiskAssessmentOutput> {
  return kycRiskAssessmentFlow(input);
}

const kycRiskAssessmentPrompt = ai.definePrompt({
  name: 'kycRiskAssessmentPrompt',
  input: {schema: KycRiskAssessmentInputSchema},
  output: {schema: KycRiskAssessmentOutputSchema},
  prompt: `You are an expert in fraud detection and risk assessment for KYC (Know Your Customer) documents.

You will analyze the provided KYC document and applicant information to determine a risk score for fraud.

Applicant Name: {{{applicantName}}}
Applicant Address: {{{applicantAddress}}}
KYC Document: {{media url=documentDataUri}}

Consider factors such as inconsistencies in the document, mismatches between the document and applicant information, and any other red flags that indicate potential fraud.

Provide a risk score between 0 and 1 (inclusive), where 0 indicates very low risk and 1 indicates very high risk. Also, explain the reasoning.

Output the risk score, risk factors, and a summary of your assessment.
`,
});

const kycRiskAssessmentFlow = ai.defineFlow(
  {
    name: 'kycRiskAssessmentFlow',
    inputSchema: KycRiskAssessmentInputSchema,
    outputSchema: KycRiskAssessmentOutputSchema,
  },
  async input => {
    const {output} = await kycRiskAssessmentPrompt(input);
    return output!;
  }
);
