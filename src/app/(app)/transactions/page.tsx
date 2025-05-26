import { columns } from "@/components/transactions/columns";
import { DataTable } from "@/components/transactions/data-table";
import type { Transaction } from "@/types";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions | VerifAI',
  description: 'View and manage your financial transactions.',
};

async function getTransactions(): Promise<Transaction[]> {
  // In a real app, you would fetch this data from an API
  // For now, we'll use mock data
  return [
    { id: "txn_1", date: "2024-07-15T10:30:00Z", description: "Online Shopping - Amazon", amount: 75.99, currency: "USD", status: "Completed", type: "Debit" },
    { id: "txn_2", date: "2024-07-14T15:45:00Z", description: "Salary Deposit - Acme Corp", amount: 2500.00, currency: "USD", status: "Completed", type: "Credit" },
    { id: "txn_3", date: "2024-07-13T08:00:00Z", description: "Coffee Shop - Starbucks", amount: 5.75, currency: "USD", status: "Completed", type: "Debit" },
    { id: "txn_4", date: "2024-07-12T12:10:00Z", description: "Utility Bill - Electricity", amount: 120.50, currency: "USD", status: "Pending", type: "Debit" },
    { id: "txn_5", date: "2024-07-11T18:05:00Z", description: "Refund - Online Store", amount: 30.00, currency: "USD", status: "Completed", type: "Credit" },
    { id: "txn_6", date: "2024-07-10T09:20:00Z", description: "Restaurant - The Italian Place", amount: 62.30, currency: "USD", status: "Completed", type: "Debit" },
    { id: "txn_7", date: "2024-07-09T14:00:00Z", description: "Transfer to Savings Account", amount: 500.00, currency: "USD", status: "Completed", type: "Debit" },
    { id: "txn_8", date: "2024-07-08T11:55:00Z", description: "Book Purchase - Local Bookstore", amount: 22.95, currency: "USD", status: "Failed", type: "Debit" },
    { id: "txn_9", date: "2024-07-07T16:30:00Z", description: "Freelance Payment Received", amount: 800.00, currency: "USD", status: "Completed", type: "Credit" },
    { id: "txn_10", date: "2024-07-06T07:15:00Z", description: "Groceries - SuperMart", amount: 95.20, currency: "USD", status: "Completed", type: "Debit" },
  ];
}

export default async function TransactionsPage() {
  const data = await getTransactions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">
          Review and manage your financial activities.
        </p>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
