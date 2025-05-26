
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitSupportTicketSchema, type SubmitSupportTicketData } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { submitSupportTicketAction } from "@/lib/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubmitSupportTicketData>({
    resolver: zodResolver(SubmitSupportTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: SubmitSupportTicketData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a support ticket.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitSupportTicketAction(user.uid, values);
      if (result.success) {
        toast({
          title: "Support Ticket Submitted",
          description: result.message,
        });
        form.reset();
      } else {
        toast({
          title: "Submission Failed",
          description: typeof result.error === 'string' ? result.error : "Please check your input and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting support ticket form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support Center</h1>
      <p className="text-muted-foreground">
        Need help? Find answers to your questions or contact our support team.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Contact Us</CardTitle>
                <CardDescription>Reach out to our support team through one of the channels below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-medium">Email Support</p>
                        <a href="mailto:support@verifai.com" className="text-sm text-muted-foreground hover:text-primary">support@verifai.com</a>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-medium">Phone Support</p>
                        <p className="text-sm text-muted-foreground">+1 (800) 555-0199 (Mon-Fri, 9am-5pm EST)</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    <div>
                        <p className="font-medium">Live Chat</p>
                        <p className="text-sm text-muted-foreground">Available on weekdays (Coming Soon)</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Issue with KYC verification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea rows={5} placeholder="Describe your issue or question in detail..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting || !user}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Message
                </Button>
                 {!user && <p className="text-xs text-destructive">Please log in to send a message.</p>}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Frequently Asked Questions (FAQ)</CardTitle>
          <CardDescription>Find quick answers to common questions.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for Accordion FAQ component */}
          <p className="text-muted-foreground">FAQ section coming soon.</p>
          <div className="mt-4 space-y-2">
            <details className="p-3 border rounded-md">
                <summary className="font-medium cursor-pointer">How long does KYC verification take?</summary>
                <p className="text-muted-foreground mt-2 text-sm">KYC verification typically takes between 1-3 business days. You will be notified via email once the process is complete.</p>
            </details>
            <details className="p-3 border rounded-md">
                <summary className="font-medium cursor-pointer">What documents are required for KYC?</summary>
                <p className="text-muted-foreground mt-2 text-sm">You will need a clear photo of a valid government-issued ID, such as a passport or driver's license.</p>
            </details>
             <details className="p-3 border rounded-md">
                <summary className="font-medium cursor-pointer">How can I apply for a loan?</summary>
                <p className="text-muted-foreground mt-2 text-sm">Navigate to the "Loans" section in your dashboard and click "Apply for New Loan". Fill out the required information and submit your application.</p>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
