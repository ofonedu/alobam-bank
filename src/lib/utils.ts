import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount?: number, currencyCode?: string): string {
  if (amount === undefined || amount === null) return "N/A";
  const code = currencyCode || "USD"; // Default to USD if no code provided

  try {
    return new Intl.NumberFormat(undefined, { // Use user's default locale for formatting rules
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes or other Intl errors
    console.warn(`Failed to format currency with code ${code}:`, error);
    return `${code} ${amount.toFixed(2)} (Format Error)`;
  }
}

// --- Name Generation Utilities ---
const americanFirstNames = ["John", "Jane", "Michael", "Emily", "David", "Sarah", "Chris", "Jessica", "James", "Linda", "Robert", "Patricia", "William", "Jennifer", "Richard", "Mary", "Charles", "Susan", "Joseph", "Karen"];
const americanLastNames = ["Smith", "Doe", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Garcia", "Rodriguez", "Jones", "Martinez", "Taylor", "Anderson", "Thomas", "Hernandez", "Moore", "Martin"];
const asianFirstNames = ["Kenji", "Sakura", "Wei", "Mei", "Hiroshi", "Yuki", "Jin", "Lien", "Raj", "Priya", "Arjun", "Ananya", "Min-jun", "Seo-yeon", "Haruto", "Aoi"];
const asianLastNames = ["Tanaka", "Kim", "Lee", "Chen", "Watanabe", "Park", "Nguyen", "Singh", "Gupta", "Khan", "Wang", "Li", "Zhang", "Liu", "Patel", "Yamamoto"];
const europeanFirstNames = ["Hans", "Sophie", "Luca", "Isabelle", "Miguel", "Clara", "Pierre", "Anna", "Viktor", "Elena", "Giovanni", "Maria", "Jan", "Eva", "Liam", "Olivia"];
const europeanLastNames = ["Müller", "Dubois", "Rossi", "García", "Silva", "Jansen", "Novak", "Ivanov", "Kowalski", "Andersson", "Schmidt", "Martin", "Fernández", "Popescu"];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function getRandomName(): string {
    const regionChoice = Math.random();
    let firstNames: string[], lastNames: string[];
    if (regionChoice < 0.33) { // American
        firstNames = americanFirstNames;
        lastNames = americanLastNames;
    } else if (regionChoice < 0.66) { // Asian
        firstNames = asianFirstNames;
        lastNames = asianLastNames;
    } else { // European
        firstNames = europeanFirstNames;
        lastNames = europeanLastNames;
    }
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${randomFirstName} ${randomLastName}`;
};
