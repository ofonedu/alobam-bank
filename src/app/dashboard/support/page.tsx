
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Phone, Loader2, AlertTriangle, Eye, ListChecks } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitSupportTicketSchema, type SubmitSupportTicketData } from "@/lib/schemas";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { submitSupportTicketAction, fetchUserSupportTicketsAction } from "@/lib/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UserSupportTicket } from "@/types";
import { UserSupportTicketDetailModal } from "./components/UserSupportTicketDetailModal";
import type { Timestamp } from "firebase/firestore";
import { Separator } from "@/components/ui/separator";

const TicketStatusBadge = ({ status }: { status: UserSupportTicket['status'] }) => {
  switch (status) {
    case 'open': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Open</Badge>;
    case 'pending_admin_reply': return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Pending Admin</Badge>;
    case 'pending_user_reply': return <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">Pending User</Badge>;
    case 'closed': return <Badge variant="outline">Closed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDateDisplay = (dateInput: Date | Timestamp | undefined): string => {
    if (!dateInput) return "N/A";
    let date: Date;
    if (typeof dateInput === "object" && "toDate" in dateInput && typeof (dateInput as Timestamp).toDate === "function") {
      date = (dateInput as Timestamp).toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      try {
        const parsed = new Date(dateInput as string | number);
        if (!isNaN(parsed.getTime())) {
          date = parsed;
        } else {
          return "Invalid Date";
        }
      } catch {
        return "Invalid Date";
      }
    }
    return date.toLocaleString();
  };

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmittingNewTicket, setIsSubmittingNewTicket] = useState(false);
  const [userTickets, setUserTickets] = useState<UserSupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [errorLoadingTickets, setErrorLoadingTickets] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<UserSupportTicket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);


  const form = useForm<SubmitSupportTicketData>({
    resolver: zodResolver(SubmitSupportTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const loadUserTickets = async () => {
    if (!user?.uid) {
      setIsLoadingTickets(false);
      return;
    }
    setIsLoadingTickets(true);
    setErrorLoadingTickets(null);
    try {
      const result = await fetchUserSupportTicketsAction(user.uid);
      if (result.success && result.tickets) {
        setUserTickets(result.tickets);
      } else {
        setErrorLoadingTickets(result.error || "Failed to load your support tickets.");
      }
    } catch (err: any) {
      setErrorLoadingTickets(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadUserTickets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmitNewTicket = async (values: SubmitSupportTicketData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit a support ticket.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingNewTicket(true);
    try {
      const result = await submitSupportTicketAction(user.uid, values);
      if (result.success) {
        toast({
          title: "Support Ticket Submitted",
          description: result.message,
        });
        form.reset();
        await loadUserTickets(); // Refresh the list of tickets
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
      setIsSubmittingNewTicket(false);
    }
  };

  const handleViewTicketDetails = (ticket: UserSupportTicket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support Center</h1>
      <p className="text-muted-foreground">
        Need help? Find answers to your questions, view your past tickets, or contact our support team.
      </p>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary"/>Your Support Tickets</CardTitle>
            <CardDescription>View your past and ongoing support requests.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingTickets ? (
                 <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-2">Loading your tickets...</p>
                </div>
            ) : errorLoadingTickets ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Tickets</AlertTitle>
                    <AlertDescription>{errorLoadingTickets}</AlertDescription>
                </Alert>
            ) : userTickets.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">You have not submitted any support tickets yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {userTickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell className="font-medium max-w-xs truncate" title={ticket.subject}>{ticket.subject}</TableCell>
                                    <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                                    <TableCell>{formatDateDisplay(ticket.updatedAt)}</TableCell>
                                    <TableCell className="text-center">
                                        <Button variant="outline" size="sm" onClick={() => handleViewTicketDetails(ticket)}>
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
      
      <Separator className="my-8" />

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
              <form onSubmit={form.handleSubmit(onSubmitNewTicket)} className="space-y-4">
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
                <Button type="submit" disabled={isSubmittingNewTicket || !user}>
                  {isSubmittingNewTicket && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
      {selectedTicket && (
        <UserSupportTicketDetailModal
            isOpen={isDetailModalOpen}
            onOpenChange={setIsDetailModalOpen}
            ticket={selectedTicket}
        />
      )}
    </div>
  );
}

    