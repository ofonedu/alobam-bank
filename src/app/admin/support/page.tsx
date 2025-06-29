
"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, LifeBuoy, MessageSquare, Edit, Loader2, AlertTriangle } from "lucide-react";
import type { AdminSupportTicket, UserProfile } from "@/types";
import { collection, getDocs, Timestamp, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminSupportTicketDetailModal } from "./components/AdminSupportTicketDetailModal";
import { useAuth } from "@/hooks/use-auth";


const TicketStatusBadge = ({ status }: { status: AdminSupportTicket['status'] }) => {
  switch (status) {
    case 'open': return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Open</Badge>;
    case 'pending_admin_reply': return <Badge variant="secondary" className="bg-yellow-500 text-black hover:bg-yellow-600">Pending Admin</Badge>;
    case 'pending_user_reply': return <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">Pending User</Badge>;
    case 'closed': return <Badge variant="outline">Closed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const PriorityBadge = ({ priority }: { priority?: AdminSupportTicket['priority'] }) => {
    if (!priority) return null;
    switch (priority) {
        case 'low': return <Badge variant="outline" className="border-green-500 text-green-700">Low</Badge>;
        case 'medium': return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Medium</Badge>;
        case 'high': return <Badge variant="outline" className="border-red-500 text-red-700">High</Badge>;
        default: return <Badge variant="outline">{priority}</Badge>;
    }
};

const formatDateDisplay = (dateInput: Date | Timestamp | undefined): string => {
    if (!dateInput) return "N/A";
    let date: Date;
    if ((dateInput as Timestamp)?.toDate && typeof (dateInput as Timestamp).toDate === 'function') {
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

export default function AdminSupportPage() {
  const { user, userProfile } = useAuth();
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ticketsCollectionRef = collection(db, "supportTickets");
      const q = query(ticketsCollectionRef, orderBy("updatedAt", "desc")); // Order by updatedAt to see recent activity
      const querySnapshot = await getDocs(q);
      const fetchedTickets: AdminSupportTicket[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        
        const processTimestamp = (field: any): Date | Timestamp => {
            if (!field) return Timestamp.now(); // Fallback, should ideally not happen for createdAt/updatedAt
            if ((field as Timestamp)?.toDate) return (field as Timestamp); // Already a Firestore Timestamp
            if (field instanceof Date) return Timestamp.fromDate(field); // Convert JS Date to Firestore Timestamp
            // Try to parse if it's a string/number, then convert to Firestore Timestamp
            try {
                const parsedDate = new Date(field as string | number);
                return Timestamp.fromDate(parsedDate);
            } catch {
                return Timestamp.now(); // Fallback for unparsable
            }
        };

        const processReplies = (repliesArray: any[] = []): SupportTicketReply[] => {
            return repliesArray.map(reply => ({
                ...reply,
                timestamp: processTimestamp(reply.timestamp)
            }));
        };
        
        return {
          id: docSnap.id,
          ...data,
          createdAt: processTimestamp(data.createdAt),
          updatedAt: processTimestamp(data.updatedAt),
          replies: processReplies(data.replies)
        } as AdminSupportTicket;
      });
      setTickets(fetchedTickets);
    } catch (err: any) {
      console.error("Error fetching support tickets:", err);
      setError("Failed to fetch support tickets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenModal = (ticket: AdminSupportTicket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleModalActionComplete = () => {
    setIsModalOpen(false);
    setSelectedTicket(null);
    fetchTickets(); // Refresh the list
  };


  const filteredTickets = tickets.filter(ticket =>
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center"><LifeBuoy className="mr-2 h-8 w-8 text-primary" />Support Tickets</h1>
          <p className="text-muted-foreground">View and manage user support requests.</p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Ticket Inbox ({isLoading ? "Loading..." : filteredTickets.length})</CardTitle>
          <CardDescription>Search, view, and manage support tickets.</CardDescription>
          <div className="pt-4">
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Ticket ID, User, Subject..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading support tickets...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Tickets</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredTickets.length === 0 && !searchTerm? (
            <p className="text-muted-foreground text-center py-8">No support tickets found.</p>
          ) : filteredTickets.length === 0 && searchTerm ? (
             <p className="text-muted-foreground text-center py-8">No tickets match your search for "{searchTerm}".</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs">{ticket.id.substring(0,10)}...</TableCell>
                      <TableCell>
                        <div>{ticket.userName}</div>
                        <div className="text-xs text-muted-foreground">{ticket.userEmail}</div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate" title={ticket.subject}>{ticket.subject}</TableCell>
                      <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                      <TableCell><PriorityBadge priority={ticket.priority} /></TableCell>
                      <TableCell>{formatDateDisplay(ticket.updatedAt)}</TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleOpenModal(ticket)}>
                            <MessageSquare className="mr-2 h-4 w-4" /> View/Reply
                        </Button>
                        {/* <Button variant="ghost" size="icon" title="Edit Ticket (e.g. Status, Priority)" disabled><Edit className="h-4 w-4" /></Button> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {selectedTicket && (
        <AdminSupportTicketDetailModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          ticket={selectedTicket}
          onActionComplete={handleModalActionComplete}
          adminUserId={user?.uid}
          adminName={userProfile?.displayName || user?.email || "Admin"}
        />
      )}
    </div>
  );
}

