
// src/lib/actions/admin-settings-actions.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { AccountTypeFormSchema, HeroSectionSchema, FeaturesOverviewSectionSchema, AccountOfferingsSectionSchema, DebitCardPromotionSchema, InvestmentOpportunitiesSchema, LoanMortgageServicesSchema, CustomerFeedbackSchema, FinalCTASchema, HeaderNavLinksSchema, FooterContentSchema, GeneralSettingsSchema, KycSettingsSchema, LoanSettingsSchema } from "@/lib/schemas";
import { collection, addDoc, Timestamp, getDocs, orderBy, query, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { revalidatePath } from "next/cache";
import type { AccountType, PlatformSettings, LandingPageContent, NavLinkItem } from "@/types"; // Removed EmailTemplate

interface AddAccountTypeResult {
  success: boolean;
  message: string;
  error?: string | Record<string, string[]>;
  accountTypeId?: string;
}

export async function addAccountTypeAction(
  formData: FormData
): Promise<AddAccountTypeResult> {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | undefined;

  const validatedData = AccountTypeFormSchema.safeParse({ name, description });

  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid form data.",
      error: validatedData.error.flatten().fieldErrors,
    };
  }

  try {
    const accountTypesColRef = collection(db, "accountTypes");
    const newAccountTypeDoc = await addDoc(accountTypesColRef, {
      name: validatedData.data.name,
      description: validatedData.data.description || "",
      createdAt: Timestamp.now(),
    });

    revalidatePath("/admin/settings/account-types");

    return {
      success: true,
      message: "Account type added successfully.",
      accountTypeId: newAccountTypeDoc.id,
    };
  } catch (error: any) {
    console.error("Error adding account type:", error);
    return {
      success: false,
      message: "Failed to add account type.",
      error: error.message,
    };
  }
}

interface GetAccountTypesResult {
  success: boolean;
  accountTypes?: AccountType[];
  error?: string;
}

export async function getAccountTypesAction(): Promise<GetAccountTypesResult> {
  try {
    const accountTypesColRef = collection(db, "accountTypes");
    const q = query(accountTypesColRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);

    const accountTypes: AccountType[] = querySnapshot.docs.map((docSnap) => { // Renamed doc to docSnap for clarity
      const data = docSnap.data();
      let createdAtDate: Date;
      if (data.createdAt && (data.createdAt as Timestamp)?.toDate) {
        createdAtDate = (data.createdAt as Timestamp).toDate();
      } else if (data.createdAt instanceof Date) {
        createdAtDate = data.createdAt;
      } else {
        // Fallback or error handling for unexpected date format
        createdAtDate = new Date(data.createdAt || Date.now());
      }
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        createdAt: createdAtDate,
      } as AccountType;
    });
    
    return { success: true, accountTypes };
  } catch (error: any) {
    console.error("Error fetching account types:", error);
    return { success: false, error: "Failed to fetch account types." };
  }
}

interface PlatformSettingsResult {
    success: boolean;
    settings?: PlatformSettings;
    message?: string;
    error?: string;
}

export async function getPlatformSettingsAction(): Promise<PlatformSettingsResult> {
    try {
        const settingsDocRef = doc(db, "settings", "platformConfig");
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
            return { success: true, settings: docSnap.data() as PlatformSettings };
        }
        return { success: true, settings: {} as PlatformSettings }; 
    } catch (error: any) {
        console.error("Error fetching platform settings:", error);
        return { success: false, error: "Failed to fetch platform settings." };
    }
}

export async function updatePlatformSettingsAction(
    settings: Partial<PlatformSettings>
): Promise<PlatformSettingsResult> {
    try {
        const settingsDocRef = doc(db, "settings", "platformConfig");
        await setDoc(settingsDocRef, settings, { merge: true });
        revalidatePath("/admin/settings");
        revalidatePath("/"); 
        if (settings.platformLogoText !== undefined || settings.platformLogoIcon !== undefined) {
            revalidatePath("/components/layout/AppLogo"); // Less ideal, better to force reload or context update
        }
        return { success: true, message: "Platform settings updated successfully." };
    } catch (error: any) {
        console.error("Error updating platform settings:", error);
        return { success: false, message: "Failed to update platform settings.", error: error.message };
    } 
}


interface AccountTypeActionResult {
    success: boolean;
    message: string;
    error?: string | Record<string, string[]>;
}

export async function editAccountTypeAction(
    id: string,
    formData: FormData
): Promise<AccountTypeActionResult> {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | undefined;

    const validatedData = AccountTypeFormSchema.safeParse({ name, description });
    if (!validatedData.success) {
        return {
            success: false,
            message: "Invalid form data.",
            error: validatedData.error.flatten().fieldErrors,
        };
    }

    try {
        const accountTypeDocRef = doc(db, "accountTypes", id);
        await updateDoc(accountTypeDocRef, {
            name: validatedData.data.name,
            description: validatedData.data.description || "",
        });
        revalidatePath("/admin/settings/account-types");
        return { success: true, message: "Account type updated successfully." };
    } catch (error: any) {
        console.error("Error updating account type:", error);
        return { success: false, message: "Failed to update account type.", error: error.message };
    }
}

export async function deleteAccountTypeAction(id: string): Promise<AccountTypeActionResult> {
    try {
        const accountTypeDocRef = doc(db, "accountTypes", id);
        await deleteDoc(accountTypeDocRef);
        revalidatePath("/admin/settings/account-types");
        return { success: true, message: "Account type deleted successfully." };
    } catch (error: any) {
        console.error("Error deleting account type:", error);
        return { success: false, message: "Failed to delete account type.", error: error.message };
    }
}

// Landing Page Content Actions
interface LandingPageContentResult {
    success: boolean;
    content?: LandingPageContent;
    error?: string;
    message?: string;
}

export async function getLandingPageContentAction(): Promise<LandingPageContentResult> {
    try {
        const contentDocRef = doc(db, "landingPageConfig", "main");
        const docSnap = await getDoc(contentDocRef);
        if (docSnap.exists()) {
            return { success: true, content: docSnap.data() as LandingPageContent };
        }
        return { success: true, content: {} as LandingPageContent }; 
    } catch (error: any) {
        console.error("Error fetching landing page content:", error);
        return { success: false, error: "Failed to fetch landing page content." };
    }
}

const sectionSchemas: Record<string, z.ZodType<any, any>> = {
  heroSection: HeroSectionSchema,
  featuresOverview: FeaturesOverviewSectionSchema,
  accountOfferings: AccountOfferingsSectionSchema,
  debitCardPromotion: DebitCardPromotionSchema,
  investmentOpportunities: InvestmentOpportunitiesSchema,
  loanMortgageServices: LoanMortgageServicesSchema,
  customerFeedback: CustomerFeedbackSchema,
  finalCTA: FinalCTASchema,
  headerNavLinks: HeaderNavLinksSchema,
  footerContent: FooterContentSchema,
};


export async function updateLandingPageSectionAction(
  sectionKey: keyof LandingPageContent | "headerNavLinks" | "footerContent",
  sectionData: any
): Promise<LandingPageContentResult> {
  try {
    let dataToSave = sectionData;
    let actualSectionKey = sectionKey;

    if (sectionKey === "headerNavLinks") {
      const validated = HeaderNavLinksSchema.safeParse({ navLinks: sectionData }); // Expects an array directly for navLinks
      if (!validated.success) {
        console.error("Validation failed for headerNavLinks:", validated.error.flatten().fieldErrors);
        return { success: false, message: "Invalid header navigation data.", error: JSON.stringify(validated.error.flatten().fieldErrors) };
      }
      dataToSave = validated.data.navLinks; // Save the array
      actualSectionKey = "headerNavLinks"; // Ensure this is the key used for Firestore
    } else if (sectionKey === "footerContent") {
      const validated = FooterContentSchema.safeParse(sectionData);
      if (!validated.success) {
         console.error("Validation failed for footerContent:", validated.error.flatten().fieldErrors);
        return { success: false, message: "Invalid footer content data.", error: JSON.stringify(validated.error.flatten().fieldErrors) };
      }
      dataToSave = validated.data;
    } else {
      const schema = sectionSchemas[sectionKey as string];
      if (schema) {
        const validated = schema.safeParse(sectionData);
        if (!validated.success) {
          console.error(`Validation failed for ${sectionKey}:`, validated.error.flatten().fieldErrors);
          return { success: false, message: `Invalid ${sectionKey} data.`, error: JSON.stringify(validated.error.flatten().fieldErrors) };
        }
        dataToSave = validated.data;
      }
    }
    
    const contentDocRef = doc(db, "landingPageConfig", "main");
    
    let updatePayload;
    if(actualSectionKey === "headerNavLinks") {
        updatePayload = { headerNavLinks: dataToSave }; 
    } else if (actualSectionKey === "footerContent") {
        updatePayload = { footerContent: dataToSave };
    } else {
        updatePayload = { [actualSectionKey]: dataToSave };
    }

    await setDoc(contentDocRef, updatePayload, { merge: true });
    
    revalidatePath("/"); 
    revalidatePath("/admin/settings/landing-page"); 

    const sectionName = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1).replace(/([A-Z])/g, ' $1');
    return { success: true, message: `${sectionName} updated successfully.` };

  } catch (error: any) {
    console.error(`Error updating landing page section ${sectionKey}:`, error);
    return { success: false, message: `Failed to update ${sectionKey}.`, error: error.message };
  }
}

    