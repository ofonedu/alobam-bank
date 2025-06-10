
// src/app/dashboard/support/components/UserSupportTicketDetailModal.tsx
"use client";

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
import { Badge } from "@/components/ui/badge";
import type { UserSupportTicket, UserSupportTicketDetailModalProps, SupportTicketReply } from "@/types";
import { UserCircle, CalendarDays, MessageSquare, ChevronDown, ChevronUp, UserCog } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Timestamp } from "firebase/firestore";
import { useState } from "react";

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

const TicketStatusBadge = ({ status }: { status: UserSupportTicket['status'] }) => {
  switch (status) {
    case 'open': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Open</Badge>;
    case 'pending_admin_reply': return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Pending Admin Reply</Badge>;
    case 'pending_user_reply': return <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">Pending Your Reply</Badge>;
    case 'closed': return <Badge variant="outline">Closed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export function UserSupportTicketDetailModal({
  isOpen,
  onOpenChange,
  ticket,
}: UserSupportTicketDetailModalProps) {
  const [showReplies, setShowReplies] = useState(true);

  if (!ticket) return null;

  // Ensure replies are sorted chronologically
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
            <span>Ticket: {ticket.id.substring(0,8)}... - {ticket.subject}</span>
            <TicketStatusBadge status={ticket.status} />
          </DialogTitle>
          <DialogDescription>
            Submitted: {formatDate(ticket.createdAt)} | Last Updated: {formatDate(ticket.updatedAt)}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6 mb-4">
            <div className="space-y-6 py-4">
                {/* Original Message */}
                <div className="bg-muted p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-foreground flex items-center">
                        <UserCircle className="mr-2 h-5 w-5 text-primary"/> You
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
                                    {reply.authorName} ({reply.authorRole === 'admin' ? 'Admin' : 'You'})
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
                 {sortedReplies.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No replies yet.</p>
                 )}
            </div>
        </ScrollArea>
        
        {/* Reply functionality can be added here later */}
        {ticket.status !== 'closed' && (
            <div className="border-t pt-4 text-center">
                 <p className="text-sm text-muted-foreground">
                    To reply to this ticket, please use the main support channels (email or phone) for now. Direct replies from this interface will be enabled soon.
                 </p>
            </div>
        )}
         {ticket.status === 'closed' && (
            <div className="border-t pt-4 text-center">
                <p className="text-sm text-muted-foreground">This ticket is closed. If you need further assistance, please open a new ticket.</p>
            </div>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    