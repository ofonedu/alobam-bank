
// src/lib/actions/admin-code-actions.ts
"use server";

import type { AuthorizationCode as AuthorizationCodeType } from "@/types";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
  updateDoc,
  type WriteBatch,
  getDoc
} from "firebase/firestore";
import { revalidatePath } from "next/cache";

interface SerializableAuthorizationCode extends Omit<AuthorizationCodeType, 'createdAt' | 'expiresAt'> {
  createdAt: string; 
  expiresAt?: string; 
}

interface GenerateCodeResult {
  success: boolean;
  message?: string;
  code?: AuthorizationCodeType; 
  error?: string;
}

export async function generateAuthorizationCodeAction(
  type: 'COT' | 'IMF' | 'TAX',
  userId?: string 
): Promise<GenerateCodeResult> {
  try {
    const randomCodeValue = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newCodeData: Omit<AuthorizationCodeType, 'id'> = {
      value: randomCodeValue,
      type,
      userId: userId || undefined,
      createdAt: Timestamp.now(),
      // expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Example: expires in 24 hours
      isUsed: false,
      generatedBy: "admin_system_placeholder", 
    };

    const codesCollectionRef = collection(db, "authorizationCodes");
    const docRef = await addDoc(codesCollectionRef, newCodeData);
    
    revalidatePath("/admin/authorization-codes");

    return { 
      success: true, 
      message: `${type} code generated successfully.`, 
      code: { ...newCodeData, id: docRef.id } 
    };
  } catch (error: any) {
    console.error("Error generating authorization code:", error);
    return { success: false, error: "Failed to generate code." };
  }
}

interface GetCodesResult {
  success: boolean;
  codes?: SerializableAuthorizationCode[]; 
  error?: string;
}

export async function getAuthorizationCodesAction(): Promise<GetCodesResult> {
  try {
    const codesCollectionRef = collection(db, "authorizationCodes");
    const q = query(codesCollectionRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const codes: SerializableAuthorizationCode[] = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as AuthorizationCodeType;
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate().toISOString(),
        expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : undefined,
      };
    });
    
    return { success: true, codes };
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
    const codeDocRef = doc(db, "authorizationCodes", codeId);
    await deleteDoc(codeDocRef);
    
    revalidatePath("/admin/authorization-codes");
    return { success: true, message: "Code deleted successfully." };
  } catch (error: any) {
    console.error("Error deleting authorization code:", error);
    return { success: false, message: "Failed to delete code.", error: error.message };
  }
}


export async function validateAuthorizationCode(
  codeValue: string, 
  type: 'COT' | 'IMF' | 'TAX', 
  userId?: string // Optional: if codes are user-specific
): Promise<{ valid: boolean; message?: string; codeId?: string }> {
  try {
    const codesCollectionRef = collection(db, "authorizationCodes");
    const q = query(
      codesCollectionRef, 
      where("value", "==", codeValue), 
      where("type", "==", type),
      where("isUsed", "==", false),
      // Optionally add where("userId", "==", userId) if codes are user-specific and userId is provided
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { valid: false, message: `Invalid or already used ${type} code.` };
    }

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data() as AuthorizationCodeType;

    if (codeData.expiresAt && codeData.expiresAt.toMillis() < Date.now()) {
      return { valid: false, message: `${type} code has expired.` };
    }
    
    if (codeData.userId && userId && codeData.userId !== userId) {
        return { valid: false, message: `${type} code is not valid for this user.`};
    }


    return { valid: true, codeId: codeDoc.id };
  } catch (error: any) {
    console.error("Error validating authorization code:", error);
    return { valid: false, message: "Error during code validation." };
  }
}

export async function markCodeAsUsed(
    codeValue: string, 
    type: 'COT' | 'IMF' | 'TAX',
    batch?: WriteBatch // Optional batch for atomic operations
): Promise<boolean> {
    try {
        const codesCollectionRef = collection(db, "authorizationCodes");
        const q = query(
            codesCollectionRef,
            where("value", "==", codeValue),
            where("type", "==", type),
            where("isUsed", "==", false), // Ensure we only mark unused codes
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Attempted to mark non-existent or already used code as used: ${type} - ${codeValue}`);
            return false; // Code not found or already used
        }
        
        const codeDocRef = querySnapshot.docs[0].ref;

        if (batch) {
            batch.update(codeDocRef, { isUsed: true });
        } else {
            await updateDoc(codeDocRef, { isUsed: true });
        }
        revalidatePath("/admin/authorization-codes");
        return true;
    } catch (error) {
        console.error(`Error marking ${type} code ${codeValue} as used:`, error);
        return false;
    }
}

export { getPlatformSettingsAction } from './admin-settings-actions'; // Re-export if needed elsewhere
