
// src/app/admin/settings/email-templates/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function EmailTemplatesPagePlaceholder() {
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Email Templates</h1>
        <p className="text-muted-foreground">Customize the content of emails sent by the system.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Email Templates Not Available</CardTitle>
          <CardDescription>This feature is currently disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Feature Under Construction</AlertTitle>
            <AlertDescription>
              The email template management system is currently not active. 
              Email functionality has been removed or is pending reimplementation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

    