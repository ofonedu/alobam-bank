
"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminSupportTicket, AdminSupportTicketDetailModalProps, SupportTicketReply } from "@/types";
import { Loader2, Send, UserCircle, CalendarDays, MessageSquare, Info, ChevronDown, ChevronUp, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminReplyToSupportTicketAction } from "@/lib/actions/admin-actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Timestamp } from "firebase/firestore";

const formatDate = (dateInput: Date | Timestamp | undefined): string => {
  if (!dateInput) return "N/A";
  let date: Date;
  if (typeof dateInput === "object" && "toDate" in dateInput && typeof (dateInput as Timestamp).toDate === "function") {
    date = (dateInput as Timestamp).toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "Invalid Date";
  }
  return date.toLocaleString();
};

const TicketStatusBadge = ({ status }: { status: AdminSupportTicket['status'] }) => {
  switch (status) {
    case 'open': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Open</Badge>;
    case 'pending_admin_reply': return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Pending Admin</Badge>;
    case 'pending_user_reply': return <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">Pending User</Badge>;
    case 'closed': return <Badge variant="outline">Closed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};


export function AdminSupportTicketDetailModal({
  isOpen,
  onOpenChange,
  ticket,
  onActionComplete,
  adminUserId,
  adminName = "Admin"
}: AdminSupportTicketDetailModalProps) {
  const { toast } = useToast();
  const [replyText, setReplyText] = useState("");
  const [newStatus, setNewStatus] = useState<AdminSupportTicket['status'] | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  useEffect(() => {
    if (ticket) {
      setReplyText("");
      setNewStatus(ticket.status); // Initialize with current ticket status
    }
  }, [ticket]);

  const handleSubmitReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ticket || !replyText.trim()) {
      toast({ title: "Cannot Submit", description: "Reply text cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const result = await adminReplyToSupportTicketAction(
        ticket.id,
        replyText,
        adminName, // Pass adminName if available
        adminUserId, // Pass adminUserId if available
        newStatus // Pass the new status if changed
    );

    if (result.success) {
      toast({ title: "Reply Sent", description: result.message });
      onActionComplete(); // Refresh the list on the main page
      // onOpenChange(false); // Optionally close dialog, or keep open to see reply
      setReplyText(""); // Clear reply text for next reply
      // The modal will re-fetch or re-render ticket with new reply if kept open and parent refreshes
    } else {
      toast({ title: "Reply Failed", description: result.error || "An unexpected error occurred.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };
  
  const handleStatusChange = async (status: AdminSupportTicket['status']) => {
    if (!ticket || ticket.status === status) return;
    setIsSubmitting(true);
     const result = await adminReplyToSupportTicketAction(
        ticket.id,
        `Admin updated status to: ${status}.`, // Optional system message for status change
        adminName,
        adminUserId,
        status // Pass the new status
    );
     if (result.success) {
      toast({ title: "Status Updated", description: `Ticket status changed to ${status}.`});
      onActionComplete();
      setNewStatus(status); // Update local state
    } else {
      toast({ title: "Status Update Failed", description: result.error || "Could not update status.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };


  if (!ticket) return null;

  const sortedReplies = ticket.replies ? [...ticket.replies].sort((a, b) => {
    const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : new Date(a.timestamp as Date).getTime();
    const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : new Date(b.timestamp as Date).getTime();
    return timeA - timeB;
  }) : [];


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ticket: {ticket.id} - {ticket.subject}</span>
            <TicketStatusBadge status={newStatus || ticket.status} />
          </DialogTitle>
          <DialogDescription>
            User: {ticket.userName} ({ticket.userEmail}) | Submitted: {formatDate(ticket.createdAt)}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6 mb-4">
            <div className="space-y-6 py-4">
                {/* Original Message */}
                <div className="bg-muted p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-foreground flex items-center">
                        <UserCircle className="mr-2 h-5 w-5 text-primary"/> {ticket.userName} (User)
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
                </div>

                {/* Replies */}
                {sortedReplies.length > 0 && (
                    <div>
                        <Button variant="ghost" onClick={() => setShowReplies(!showReplies)} className="w-full justify-start px-0 mb-2 text-sm text-primary hover:text-primary/90">
                            {showReplies ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                            {showReplies ? "Hide" : "Show"} {sortedReplies.length} Replies
                        </Button>
                        {showReplies && (
                            <div className="space-y-4 pl-4 border-l-2 border-border ml-2">
                            {sortedReplies.map((reply) => (
                                <div key={reply.id} className={`p-3 rounded-md ${reply.authorRole === 'admin' ? 'bg-primary/10' : 'bg-muted/70'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-xs font-semibold text-foreground flex items-center">
                                    {reply.authorRole === 'admin' ? <UserCog className="mr-2 h-4 w-4 text-blue-500"/> : <UserCircle className="mr-2 h-4 w-4 text-green-500"/>}
                                    {reply.authorName} ({reply.authorRole === 'admin' ? 'Admin' : 'User'})
                                    </p>
                                    <p className="text-xs text-muted-foreground">{formatDate(reply.timestamp)}</p>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmitReply} className="space-y-3 border-t pt-4">
            <div>
                <Label htmlFor="replyText" className="font-semibold">Your Reply</Label>
                <Textarea
                id="replyText"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to the user..."
                rows={4}
                className="mt-1"
                disabled={isSubmitting || ticket.status === 'closed'}
                />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="w-full sm:w-auto">
                    <Label htmlFor="newStatus" className="text-xs text-muted-foreground">Update Status</Label>
                    <Select 
                        value={newStatus || ticket.status} 
                        onValueChange={(value) => handleStatusChange(value as AdminSupportTicket['status'])}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger id="newStatus" className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="pending_user_reply">Pending User Reply</SelectItem>
                            <SelectItem value="pending_admin_reply">Pending Admin Reply</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button type="submit" disabled={isSubmitting || !replyText.trim() || ticket.status === 'closed'} className="w-full sm:w-auto">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Reply
                </Button>
            </div>
             {ticket.status === 'closed' && (
                <p className="text-sm text-muted-foreground text-center">This ticket is closed. To reopen, change its status.</p>
            )}
        </form>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

