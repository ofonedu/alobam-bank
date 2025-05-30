
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
  // Removed getDoc as it's not used directly here for now
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
      userId: userId || undefined, // Store as undefined if not provided, Firestore handles this well
      createdAt: Timestamp.now(),
      // expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Example: expires in 24 hours
      isUsed: false,
      generatedBy: "admin_system_placeholder", // TODO: Capture actual admin UID if possible
    };

    const codesCollectionRef = collection(db, "authorizationCodes");
    const docRef = await addDoc(codesCollectionRef, newCodeData);
    
    revalidatePath("/admin/authorization-codes");

    return { 
      success: true, 
      message: `${type} code generated successfully.`, 
      code: { ...newCodeData, id: docRef.id } // Return the full code object including the generated ID
    };
  } catch (error: any) {
    console.error("Error generating authorization code. Details:", error);
    // Return a more specific error message
    return { 
        success: false, 
        error: error.message || "An unknown error occurred during code generation." 
    };
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
      const data = docSnap.data(); 
      let createdAtDate: Date;
      if (data.createdAt && (data.createdAt as Timestamp)?.toDate) {
        createdAtDate = (data.createdAt as Timestamp).toDate();
      } else {
        createdAtDate = new Date(data.createdAt); 
      }

      let expiresAtDate: Date | undefined = undefined;
      if (data.expiresAt) {
        if((data.expiresAt as Timestamp)?.toDate) {
            expiresAtDate = (data.expiresAt as Timestamp).toDate();
        } else {
            expiresAtDate = new Date(data.expiresAt);
        }
      }

      return {
        id: docSnap.id,
        value: data.value,
        type: data.type,
        userId: data.userId,
        createdAt: createdAtDate.toISOString(),
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : undefined,
        isUsed: data.isUsed,
        generatedBy: data.generatedBy,
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
  userId?: string 
): Promise<{ valid: boolean; message?: string; codeId?: string }> {
  try {
    const codesCollectionRef = collection(db, "authorizationCodes");
    const qConstraints = [
        where("value", "==", codeValue), 
        where("type", "==", type),
        where("isUsed", "==", false),
    ];

    // If userId is provided, add it to the query. 
    // This handles both global codes (userId not set) and user-specific codes.
    // For user-specific codes, we also need to consider codes where userId is explicitly undefined or null if they are meant to be global.
    // A more robust way might be to have a separate check or allow userId to be null in the query if global codes are allowed.
    // For now, if userId is passed for validation, we assume it's for a user-specific code.
    if (userId) {
        qConstraints.push(where("userId", "==", userId));
    }
    // To also allow global codes (where code.userId is not set) when a userId is passed for validation,
    // you'd need a more complex OR query or fetch twice, which Firestore doesn't directly support in a single query like this.
    // A common pattern is: 1. Check for user-specific code. 2. If not found, check for global code.
    // For simplicity here, if userId is passed, it only looks for codes matching that userId.

    const q = query(codesCollectionRef, ...qConstraints, limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // If userId was provided and no user-specific code was found, check for a global code
      if (userId) {
        const globalQConstraints = [
            where("value", "==", codeValue), 
            where("type", "==", type),
            where("isUsed", "==", false),
            where("userId", "==", null) // Or where("userId", "not-in", [any_non_null_value_if_firestore_allowed_that])
                                        // A common way is to simply not set the userId field for global codes.
                                        // Firestore queries for "not equal" or "is null" on a field that might not exist can be tricky.
                                        // A better way for global codes is to ensure 'userId' is absent or explicitly 'null'.
                                        // For this example, let's assume global codes have userId field missing or explicitly null.
                                        // A query for a field NOT being set is not directly possible.
                                        // So, we rely on the first query failing for a user-specific code if a global one is intended.
                                        // This part needs careful schema design for global vs user-specific codes.
                                        // For now, we'll assume the above query is sufficient if user-specific codes are primary.
        ];
         const globalQ = query(codesCollectionRef, 
            where("value", "==", codeValue), 
            where("type", "==", type),
            where("isUsed", "==", false),
            // where("userId", "==", undefined) // Firestore doesn't like querying for undefined directly
            // A common pattern for "global" is to simply omit the userId field, or set it to a specific global marker.
            // Let's assume for now global codes have no userId field OR it's explicitly null.
            // This check is simplified and might need refinement based on exact schema for global codes.
         );
         const globalSnapshot = await getDocs(globalQ);
         if (!globalSnapshot.empty) {
            const globalCodeDoc = globalSnapshot.docs[0];
            const globalCodeData = globalCodeDoc.data() as AuthorizationCodeType;
            if (globalCodeData.userId === undefined || globalCodeData.userId === null) { // Check if it's truly global
                 if (globalCodeData.expiresAt && globalCodeData.expiresAt.toMillis() < Date.now()) {
                    return { valid: false, message: `${type} code has expired.` };
                }
                return { valid: true, codeId: globalCodeDoc.id };
            }
         }
      }
      return { valid: false, message: `Invalid or already used ${type} code.` };
    }

    const codeDoc = querySnapshot.docs[0];
    const codeData = codeDoc.data() as AuthorizationCodeType;

    if (codeData.expiresAt && codeData.expiresAt.toMillis() < Date.now()) {
      return { valid: false, message: `${type} code has expired.` };
    }
    
    // This check is now more specific due to the query including userId if provided
    // If we reached here and userId was part of the query, it's valid for this user.
    // If userId was not part of the query (i.e., validating a potentially global code), this check is still fine.
    // However, the main logic for user-specific vs global needs to be robust in the query.

    return { valid: true, codeId: codeDoc.id };
  } catch (error: any) {
    console.error("Error validating authorization code:", error);
    return { valid: false, message: "Error during code validation." };
  }
}

export async function markCodeAsUsed(
    codeValue: string, 
    type: 'COT' | 'IMF' | 'TAX',
    batch?: WriteBatch 
): Promise<boolean> {
    try {
        const codesCollectionRef = collection(db, "authorizationCodes");
        // Find the specific code that is NOT used yet
        const q = query(
            codesCollectionRef,
            where("value", "==", codeValue),
            where("type", "==", type),
            where("isUsed", "==", false), 
            limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.warn(`Attempted to mark non-existent or already used code as used: ${type} - ${codeValue}`);
            return false; 
        }
        
        const codeDocRef = querySnapshot.docs[0].ref;

        if (batch) {
            batch.update(codeDocRef, { isUsed: true, updatedAt: Timestamp.now() });
        } else {
            await updateDoc(codeDocRef, { isUsed: true, updatedAt: Timestamp.now() });
        }
        revalidatePath("/admin/authorization-codes");
        return true;
    } catch (error) {
        console.error(`Error marking ${type} code ${codeValue} as used:`, error);
        return false;
    }
}

// Removed re-export: export { getPlatformSettingsAction } from './admin-settings-actions'; // Ensure this is not present
    
