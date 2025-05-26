import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserCircle, FileText, BarChartBig } from "lucide-react";
import Link from "next/link";
import { PATHS } from "@/lib/paths";
import type { Metadata } from 'next';
import Image from "next/image";

export const metadata: Metadata = {
  title: 'Dashboard | VerifAI',
  description: 'Your VerifAI dashboard for managing finances and KYC.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to VerifAI</h1>
          <p className="text-muted-foreground">Manage your profile, applications, and track transactions.</p>
        </div>
        <Button asChild>
          <Link href={PATHS.KYC}>
            Complete KYC <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Profile Management</CardTitle>
            <UserCircle className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and update your personal information.
            </p>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              View Profile <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
             <Image 
                src="https://placehold.co/600x400.png"
                alt="Profile illustration"
                width={600}
                height={400}
                className="mt-4 rounded-md object-cover aspect-video"
                data-ai-hint="profile user"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Loan Applications</CardTitle>
            <FileText className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Apply for new loans or track existing applications. (Coming Soon)
            </p>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              Manage Loans <ArrowRight className="ml-2 h-3 w-3" />
            </Button>
            <Image 
                src="https://placehold.co/600x400.png"
                alt="Loan application illustration"
                width={600}
                height={400}
                className="mt-4 rounded-md object-cover aspect-video"
                data-ai-hint="finance document"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Transaction Tracking</CardTitle>
            <BarChartBig className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review your recent financial activity.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href={PATHS.TRANSACTIONS}>
                View Transactions <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
             <Image 
                src="https://placehold.co/600x400.png"
                alt="Transactions illustration"
                width={600}
                height={400}
                className="mt-4 rounded-md object-cover aspect-video"
                data-ai-hint="data chart"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
