
// src/lib/actions/admin-code-actions.ts
"use server";

import type { AuthorizationCode } from "@/types";
import { Timestamp } from "firebase/firestore"; // For mock data, not actual Firestore writes yet
import { revalidatePath } from "next/cache";

// In-memory store for demo purposes. Replace with Firestore for production.
let mockCodes: AuthorizationCode[] = [];

// Define a type for the serializable version of AuthorizationCode
interface SerializableAuthorizationCode extends Omit<AuthorizationCode, 'createdAt' | 'expiresAt'> {
  createdAt: string; // ISO string
  expiresAt?: string; // ISO string or undefined
}

interface GenerateCodeResult {
  success: boolean;
  message?: string;
  code?: AuthorizationCode; // Original type can be used for the newly generated one if not immediately passed to client
  error?: string;
}

export async function generateAuthorizationCodeAction(
  type: 'COT' | 'IMF' | 'TAX',
  userId?: string // Optional userId
): Promise<GenerateCodeResult> {
  try {
    const randomCodeValue = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newCode: AuthorizationCode = {
      id: `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Mock ID
      value: randomCodeValue,
      type,
      userId: userId || undefined,
      createdAt: Timestamp.now(), // Using Firestore Timestamp for consistency in type
      // expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Example: expires in 24 hours
      isUsed: false,
      generatedBy: "admin_system_placeholder", // Placeholder admin ID
    };

    mockCodes.push(newCode);
    revalidatePath("/admin/authorization-codes");

    return { success: true, message: `${type} code generated successfully.`, code: newCode };
  } catch (error: any) {
    console.error("Error generating authorization code:", error);
    return { success: false, error: "Failed to generate code." };
  }
}

interface GetCodesResult {
  success: boolean;
  codes?: SerializableAuthorizationCode[]; // Return serializable codes
  error?: string;
}

export async function getAuthorizationCodesAction(): Promise<GetCodesResult> {
  try {
    // Simulate fetching. Sort by creation date descending for demo.
    const sortedCodes = [...mockCodes].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    const serializableCodes: SerializableAuthorizationCode[] = sortedCodes.map(code => ({
      ...code,
      createdAt: code.createdAt.toDate().toISOString(),
      expiresAt: code.expiresAt ? code.expiresAt.toDate().toISOString() : undefined,
    }));
    
    return { success: true, codes: serializableCodes };
  } catch (error: any) {
    console.error("Error fetching authorization codes:", error);
    return { success: false, error: "Failed to fetch codes." };
  }
}

interface DeleteCodeResult {
  success: boolean;
  message: string;
  error?: string;
}

export async function deleteAuthorizationCodeAction(codeId: string): Promise<DeleteCodeResult> {
  try {
    const initialLength = mockCodes.length;
    mockCodes = mockCodes.filter(code => code.id !== codeId);
    
    if (mockCodes.length < initialLength) {
      revalidatePath("/admin/authorization-codes");
      return { success: true, message: "Code deleted successfully." };
    }
    return { success: false, message: "Code not found.", error: "Code not found." };
  } catch (error: any) {
    console.error("Error deleting authorization code:", error);
    return { success: false, message: "Failed to delete code.", error: error.message };
  }
}

// Placeholder for future function to validate codes
export async function validateAuthorizationCode(codeValue: string, type: 'COT' | 'IMF' | 'TAX', userId?: string): Promise<{ valid: boolean; message?: string }> {
  // In a real system, this would query Firestore, check expiry, usage status, and optionally userId.
  const foundCode = mockCodes.find(c => c.value === codeValue && c.type === type && !c.isUsed);
  if (foundCode) {
    // Optionally check expiry: if (foundCode.expiresAt && foundCode.expiresAt.toMillis() < Date.now()) return { valid: false, message: "Code expired." };
    // Optionally check userId: if (foundCode.userId && foundCode.userId !== userId) return { valid: false, message: "Code not valid for this user." };
    return { valid: true };
  }
  return { valid: false, message: `Invalid or already used ${type} code.` };
}

// Placeholder to mark code as used
export async function markCodeAsUsed(codeValue: string, type: 'COT' | 'IMF' | 'TAX'): Promise<void> {
    const codeIndex = mockCodes.findIndex(c => c.value === codeValue && c.type === type);
    if (codeIndex > -1) {
        mockCodes[codeIndex].isUsed = true;
    }
}

    
