export type User = {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
};

export type Transaction = {
  id: string;
  date: string; // ISO string or formatted date string
  description: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Completed' | 'Failed';
  type: 'Credit' | 'Debit';
};

export type KycDocumentInfo = {
  fileName: string;
  fileType: string;
  fileSize: number;
};
