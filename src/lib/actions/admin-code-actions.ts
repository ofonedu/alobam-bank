
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
  createdAt: string; // Store as ISO string for client
  expiresAt?: string; // Store as ISO string for client
}

interface GenerateCodeResult {
  success: boolean;
  message?: string;
  code?: SerializableAuthorizationCode; // Return serializable code
  error?: string;
}

export async function generateAuthorizationCodeAction(
  type: 'COT' | 'IMF' | 'TAX',
  userId?: string
): Promise<GenerateCodeResult> {
  try {
    const randomCodeValue = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const newCodeDataObject: Omit<AuthorizationCodeType, 'id' | 'userId' | 'expiresAt'> & { userId?: string; expiresAt?: Timestamp } = {
      value: randomCodeValue,
      type,
      createdAt: Timestamp.now(),
      isUsed: false,
      generatedBy: "admin_system_placeholder", // In a real app, capture the actual admin's UID
    };

    if (userId && userId.trim() !== "") {
      newCodeDataObject.userId = userId;
    }
    // Example for expiresAt if you wanted to add it:
    // newCodeDataObject.expiresAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Expires in 24 hours

    const codesCollectionRef = collection(db, "authorizationCodes");
    const docRef = await addDoc(codesCollectionRef, newCodeDataObject as Omit<AuthorizationCodeType, 'id'>);
    
    revalidatePath("/admin/authorization-codes");

    // Construct the serializable code object for the return value
    const generatedCodeForClient: SerializableAuthorizationCode = {
        id: docRef.id,
        value: newCodeDataObject.value,
        type: newCodeDataObject.type,
        createdAt: newCodeDataObject.createdAt.toDate().toISOString(), // Convert Timestamp to ISO string
        isUsed: newCodeDataObject.isUsed,
        generatedBy: newCodeDataObject.generatedBy,
    };

    if (newCodeDataObject.userId) {
        generatedCodeForClient.userId = newCodeDataObject.userId;
    }
    if (newCodeDataObject.expiresAt) {
        generatedCodeForClient.expiresAt = newCodeDataObject.expiresAt.toDate().toISOString(); // Convert Timestamp to ISO string
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
      }
       else {
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
        userId: data.userId, 
        createdAt: createdAtDate.toISOString(),
        expiresAt: expiresAtDate ? expiresAtDate.toISOString() : undefined,
        isUsed: data.isUsed,
        generatedBy: data.generatedBy,
      } as SerializableAuthorizationCode; // Ensure type matches
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
            if (codeData.expiresAt && (codeData.expiresAt as Timestamp).toMillis() < Date.now()) {
                return { valid: false, message: `${type} code has expired.` };
            }
            return { valid: true, codeId: codeDoc.id };
        }
    }

    const globalQueryConstraints = [
        where("value", "==", codeValue),
        where("type", "==", type),
        where("isUsed", "==", false),
        where("userId", "==", null) 
    ];

    const globalQ = query(codesCollectionRef, ...globalQueryConstraints, limit(1));
    const globalSnapshot = await getDocs(globalQ);

    if (!globalSnapshot.empty) {
        const codeDoc = globalSnapshot.docs[0];
        const codeData = codeDoc.data() as AuthorizationCodeType;
         if (codeData.expiresAt && (codeData.expiresAt as Timestamp).toMillis() < Date.now()) {
            return { valid: false, message: `${type} code has expired.` };
        }
        return { valid: true, codeId: codeDoc.id };
    }
    
    return { valid: false, message: `Invalid or already used ${type} code, or code not found for this user.` };

  } catch (error: any)
{
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

// Removed re-export of getPlatformSettingsAction as it caused "use server" issues.
// Import it directly where needed from './admin-settings-actions'.
