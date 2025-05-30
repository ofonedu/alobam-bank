
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
    
    // Initialize with fields always present
    const newCodeDataObject: Omit<AuthorizationCodeType, 'id' | 'userId' | 'expiresAt'> & { userId?: string; expiresAt?: Timestamp } = {
      value: randomCodeValue,
      type,
      createdAt: Timestamp.now(),
      isUsed: false,
      generatedBy: "admin_system_placeholder",
    };

    // Conditionally add userId if it's a non-empty string
    if (userId && userId.trim() !== "") {
      newCodeDataObject.userId = userId;
    }
    // expiresAt can be added here if needed, e.g.:
    // newCodeDataObject.expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));


    const codesCollectionRef = collection(db, "authorizationCodes");
    // Cast to the full expected type for addDoc, Firestore handles optional fields correctly if they are not present
    const docRef = await addDoc(codesCollectionRef, newCodeDataObject as Omit<AuthorizationCodeType, 'id'>);
    
    revalidatePath("/admin/authorization-codes");

    // Construct the full code object for the return value
    const returnedCode: AuthorizationCodeType = {
        id: docRef.id,
        value: newCodeDataObject.value,
        type: newCodeDataObject.type,
        createdAt: newCodeDataObject.createdAt,
        isUsed: newCodeDataObject.isUsed,
        generatedBy: newCodeDataObject.generatedBy,
    };
    if (newCodeDataObject.userId) {
        returnedCode.userId = newCodeDataObject.userId;
    }
    if (newCodeDataObject.expiresAt) {
        returnedCode.expiresAt = newCodeDataObject.expiresAt;
    }

    return {
      success: true,
      message: `${type} code generated successfully.`,
      code: returnedCode
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
      }
       else {
        createdAtDate = new Date(data.createdAt); // Fallback, might be incorrect if data.createdAt is not a valid date string/number
      }

      let expiresAtDate: Date | undefined = undefined;
      if (data.expiresAt) {
        if((data.expiresAt as Timestamp)?.toDate) {
            expiresAtDate = (data.expiresAt as Timestamp).toDate();
        } else if (data.expiresAt instanceof Date) {
            expiresAtDate = data.expiresAt;
        } else {
            expiresAtDate = new Date(data.expiresAt);
        }
      }

      return {
        id: docSnap.id,
        value: data.value,
        type: data.type,
        userId: data.userId, // Will be undefined if not present in Firestore
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
    
    // Attempt to find a user-specific code first if userId is provided
    if (userId) {
        const userSpecificQuery = query(
            codesCollectionRef,
            where("value", "==", codeValue),
            where("type", "==", type),
            where("isUsed", "==", false),
            where("userId", "==", userId),
            limit(1)
        );
        const userSnapshot = await getDocs(userSpecificQuery);
        if (!userSnapshot.empty) {
            const codeDoc = userSnapshot.docs[0];
            const codeData = codeDoc.data() as AuthorizationCodeType;
            if (codeData.expiresAt && codeData.expiresAt.toMillis() < Date.now()) {
                return { valid: false, message: `${type} code has expired.` };
            }
            return { valid: true, codeId: codeDoc.id };
        }
    }

    // If no user-specific code was found (or if userId wasn't provided), check for a global code
    // Global codes are identified by having no userId field or userId being explicitly null.
    // For simplicity, we'll query for codes where userId is not set (or not equal to any specific user if that was possible)
    // A more robust way is to ensure global codes either have userId: null or the field is absent.
    // Firestore's '!=' and 'not-in' queries have limitations with non-existent fields.
    // So, we'll query for codes that match value, type, and isUsed, then filter client-side or ensure schema discipline.
    // Let's refine to query for userId == null (which implies it was explicitly set to null for global)
    // OR rely on the fact that if userId was provided above and not found, the next check can be for truly global (userId absent)

    const globalQueryConstraints = [
        where("value", "==", codeValue),
        where("type", "==", type),
        where("isUsed", "==", false),
        // To find "global" codes, we look for codes where 'userId' is explicitly null or not set.
        // Firestore queries for "field does not exist" are not direct.
        // We can query for `userId == null`. If you save global codes by *omitting* the userId field, this won't find them.
        // A common pattern is to save global codes with `userId: null`.
        where("userId", "==", null) // This finds codes explicitly marked as global with userId: null
    ];


    const globalQ = query(codesCollectionRef, ...globalQueryConstraints, limit(1));
    const globalSnapshot = await getDocs(globalQ);

    if (!globalSnapshot.empty) {
        const codeDoc = globalSnapshot.docs[0];
        const codeData = codeDoc.data() as AuthorizationCodeType;
         if (codeData.expiresAt && codeData.expiresAt.toMillis() < Date.now()) {
            return { valid: false, message: `${type} code has expired.` };
        }
        return { valid: true, codeId: codeDoc.id };
    }
    
    // If we are here, no valid user-specific or global (with userId: null) code was found.
    return { valid: false, message: `Invalid or already used ${type} code, or code not found for this user.` };

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
        // This needs to be more specific if codes can be reused by different users or types.
        // Assuming value + type should be unique for active codes.
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
