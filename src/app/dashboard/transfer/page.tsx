
// src/app/dashboard/transfer/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocalTransferForm } from "./components/local-transfer-form";
import { InternationalTransferForm } from "./components/international-transfer-form";
import { Banknote, Globe } from "lucide-react";

export default function TransferPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Fund Transfer</h1>
        <p className="text-muted-foreground">
          Securely transfer funds to local or international recipients.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Initiate Transfer</CardTitle>
          <CardDescription>Select transfer type and fill in the details below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 sm:w-auto md:w-[400px]">
              <TabsTrigger value="local">
                <Banknote className="mr-2 h-4 w-4" />
                Local Transfer
              </TabsTrigger>
              <TabsTrigger value="international">
                <Globe className="mr-2 h-4 w-4" />
                International Transfer
              </TabsTrigger>
            </TabsList>
            <TabsContent value="local" className="mt-6">
              <Card>
                <CardHeader>
                    <CardTitle>Local Recipient Details</CardTitle>
                    <CardDescription>For transfers within the same country.</CardDescription>
                </CardHeader>
                <CardContent>
                    <LocalTransferForm />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="international" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>International Recipient Details</CardTitle>
                        <CardDescription>For transfers to a different country.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <InternationalTransferForm />
                    </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
