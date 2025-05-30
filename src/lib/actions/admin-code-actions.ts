
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
  serverTimestamp,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";

interface SerializableAuthorizationCode extends Omit<AuthorizationCodeType, 'createdAt' | 'expiresAt' | 'userId'> {
  createdAt: string;
  expiresAt?: string;
  userId?: string; // Keep userId optional for client
}

interface GenerateCodeResult {
  success: boolean;
  message?: string;
  code?: SerializableAuthorizationCode;
  error?: string;
}

export async function generateAuthorizationCodeAction(
  type: 'COT' | 'IMF' | 'TAX',
  targetUserId?: string // Renamed for clarity
): Promise<GenerateCodeResult> {
  try {
    const randomCodeValue = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const newCodeDataObject: Omit<AuthorizationCodeType, 'id'> = {
      value: randomCodeValue,
      type,
      // Explicitly set userId to null if targetUserId is empty/undefined, otherwise use targetUserId
      userId: (targetUserId && targetUserId.trim() !== "") ? targetUserId : null,
      createdAt: Timestamp.now(),
      isUsed: false,
      generatedBy: "admin_system_placeholder", 
    };

    const codesCollectionRef = collection(db, "authorizationCodes");
    const docRef = await addDoc(codesCollectionRef, newCodeDataObject);
    
    revalidatePath("/admin/authorization-codes");

    // Construct the serializable code object for the return value
    const generatedCodeForClient: SerializableAuthorizationCode = {
        id: docRef.id,
        value: newCodeDataObject.value,
        type: newCodeDataObject.type,
        createdAt: newCodeDataObject.createdAt.toDate().toISOString(),
        isUsed: newCodeDataObject.isUsed,
        generatedBy: newCodeDataObject.generatedBy,
        userId: newCodeDataObject.userId === null ? undefined : newCodeDataObject.userId, // Convert null to undefined for client
    };

    if (newCodeDataObject.expiresAt) {
        generatedCodeForClient.expiresAt = (newCodeDataObject.expiresAt as Timestamp).toDate().toISOString();
    }

    return {
      success: true,
      message: `${type} code generated successfully.`,
      code: generatedCodeForClient
    };
  } catch (error: any) {
    console.error("Error generating authorization code. Details:", error);
    console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
      } else if (data.createdAt instanceof Date) {
        createdAtDate = data.createdAt;
      } else {
        createdAtDate = new Date(data.createdAt as string | number); 
      }

      let expiresAtDate: Date | undefined = undefined;
      if (data.expiresAt) {
        if((data.expiresAt as Timestamp)?.toDate) {
            expiresAtDate = (data.expiresAt as Timestamp).toDate();
        } else if (data.expiresAt instanceof Date) {
            expiresAtDate = data.expiresAt;
        } else {
            expiresAtDate = new Date(data.expiresAt as string | number);
        }
      }

      return {
        id: docSnap.id,
        value: data.value,
        type: data.type,
        userId: data.userId === null ? undefined : data.userId, // Convert null to undefined
        createdAt: createdAtDate.toISOString(),
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : undefined,
        isUsed: data.isUsed,
        generatedBy: data.generatedBy,
      } as SerializableAuthorizationCode; 
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
  userId?: string // This is the user performing the transaction
): Promise<{ valid: boolean; message?: string; codeId?: string }> {
  try {
    const codesCollectionRef = collection(db, "authorizationCodes");
    
    // 1. Check for a user-specific, unused, non-expired code
    if (userId) {
        const userSpecificQuery = query(
            codesCollectionRef,
            where("value", "==", codeValue),
            where("type", "==", type),
            where("isUsed", "==", false),
            where("userId", "==", userId), // Check for codes assigned to this specific user
            limit(1)
        );
        const userSnapshot = await getDocs(userSpecificQuery);
        if (!userSnapshot.empty) {
            const codeDoc = userSnapshot.docs[0];
            const codeData = codeDoc.data() as AuthorizationCodeType;
            if (codeData.expiresAt && (codeData.expiresAt as Timestamp).toMillis() < Date.now()) {
                return { valid: false, message: `${type} code assigned to you has expired.` };
            }
            return { valid: true, codeId: codeDoc.id };
        }
    }

    // 2. If no user-specific code found (or no userId provided for the check),
    //    check for a global, unused, non-expired code
    const globalQuery = query(
        codesCollectionRef,
        where("value", "==", codeValue),
        where("type", "==", type),
        where("isUsed", "==", false),
        where("userId", "==", null), // Global codes have userId explicitly set to null
        limit(1)
    );
    const globalSnapshot = await getDocs(globalQuery); // Corrected variable name

    if (!globalSnapshot.empty) {
        const codeDoc = globalSnapshot.docs[0];
        const codeData = codeDoc.data() as AuthorizationCodeType;
         if (codeData.expiresAt && (codeData.expiresAt as Timestamp).toMillis() < Date.now()) {
            return { valid: false, message: `Global ${type} code has expired.` };
        }
        return { valid: true, codeId: codeDoc.id };
    }
    
    return { valid: false, message: `Invalid or already used ${type} code, or code not found for this user.` };

  } catch (error: any) {
    console.error("Error validating authorization code:", error);
    return { valid: false, message: "Error during code validation." };
  }
}

// Refactored to take codeId
export async function markCodeAsUsed(
    codeId: string,
    batch?: WriteBatch
): Promise<boolean> {
    try {
        const codeDocRef = doc(db, "authorizationCodes", codeId);
        const updateData = { isUsed: true, updatedAt: serverTimestamp() as Timestamp }; // Use serverTimestamp

        if (batch) {
            batch.update(codeDocRef, updateData);
        } else {
            await updateDoc(codeDocRef, updateData);
        }
        revalidatePath("/admin/authorization-codes"); // Revalidate even if part of a batch, as the action might complete later
        console.log(`Authorization code ${codeId} marked as used.`);
        return true;
    } catch (error) {
        console.error(`Error marking code ${codeId} as used:`, error);
        return false;
    }
}

    