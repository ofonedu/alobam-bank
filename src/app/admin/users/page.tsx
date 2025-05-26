
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Eye, DollarSign, UserCog, UserX, Loader2, AlertTriangle, PlayCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AdminUserView } from "@/types"; 
import { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminUserRoleDialog } from "./components/admin-user-role-dialog";
import { AdjustBalanceDialog } from "./components/adjust-balance-dialog"; 
import { ViewUserDetailModal } from "./components/ViewUserDetailModal";
import { updateUserSuspensionStatusAction } from "@/lib/actions/admin-actions"; 
import { useToast } from "@/hooks/use-toast";


const KYCStatusBadge = ({ status }: { status?: AdminUserView['kycStatus'] }) => {
  switch (status) {
    case 'verified': return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">Verified</Badge>;
    case 'pending_review': return <Badge variant="secondary">Pending</Badge>;
    case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
    case 'not_started': return <Badge variant="outline">Not Started</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const RoleBadge = ({ role }: { role?: AdminUserView['role'] }) => {
  switch (role) {
    case 'admin': return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-white">Admin</Badge>;
    case 'user': return <Badge variant="secondary">User</Badge>;
    default: return <Badge variant="outline">Unknown</Badge>;
  }
};

const AccountStatusBadge = ({ isSuspended }: { isSuspended?: boolean }) => {
  if (isSuspended) {
    return <Badge variant="destructive">Suspended</Badge>;
  }
  return <Badge className="bg-green-500 hover:bg-green-600 text-white">Active</Badge>;
};


export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserView | null>(null);

  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false); 
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<AdminUserView | null>(null); 

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AdminUserView | null>(null);

  const [suspendingUserId, setSuspendingUserId] = useState<string | null>(null); 

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(usersCollectionRef);
      const fetchedUsers: AdminUserView[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ 
          uid: doc.id, 
          ...doc.data() 
        } as AdminUserView);
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenRoleDialog = (user: AdminUserView) => {
    setSelectedUserForRole(user);
    setIsRoleDialogOpen(true);
  };

  const handleRoleUpdateSuccess = () => {
    setIsRoleDialogOpen(false);
    fetchUsers(); 
  };

  const handleOpenBalanceDialog = (user: AdminUserView) => {
    setSelectedUserForBalance(user);
    setIsBalanceDialogOpen(true);
  };

  const handleBalanceUpdateSuccess = () => {
    setIsBalanceDialogOpen(false);
    fetchUsers(); 
  };

  const handleOpenDetailModal = (user: AdminUserView) => {
    setSelectedUserForDetail(user);
    setIsDetailModalOpen(true);
  };

  const handleToggleSuspension = async (user: AdminUserView) => {
    if (!user || !user.uid) return;
    setSuspendingUserId(user.uid);
    const newSuspensionStatus = !user.isSuspended;
    try {
      const result = await updateUserSuspensionStatusAction(user.uid, newSuspensionStatus);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        fetchUsers(); 
      } else {
        toast({ title: "Error", description: result.message || "Failed to update suspension status.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setSuspendingUserId(null);
    }
  };


  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">View, edit, and manage user accounts.</p>
        </div>
        <Button disabled className="w-full sm:w-auto"> 
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User List ({isLoading ? "Loading..." : filteredUsers.length})</CardTitle>
          <CardDescription>Search and filter users.</CardDescription>
          <div className="pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or ID..." 
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
              <p className="ml-2">Loading users...</p>
            </div>
          ) : error ? (
             <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Users</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : filteredUsers.length === 0 && !searchTerm ? (
            <p className="text-muted-foreground text-center py-8">No users found in the system.</p>
          ) : filteredUsers.length === 0 && searchTerm ? (
            <p className="text-muted-foreground text-center py-8">No users match your search for "{searchTerm}".</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.uid} className={user.isSuspended ? "bg-muted/50" : ""}>
                      <TableCell className="font-mono text-xs">{user.uid}</TableCell>
                      <TableCell className="font-medium">{user.displayName || "N/A"}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell><KYCStatusBadge status={user.kycStatus} /></TableCell>
                      <TableCell><AccountStatusBadge isSuspended={user.isSuspended} /></TableCell>
                      <TableCell className="text-right">${user.balance?.toFixed(2) ?? '0.00'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" title="View User Details" onClick={() => handleOpenDetailModal(user)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title={user.role === 'admin' ? "Edit Role / Revoke Admin" : "Edit Role / Make Admin"} 
                              onClick={() => handleOpenRoleDialog(user)}
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Adjust Balance" onClick={() => handleOpenBalanceDialog(user)}>
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Manage KYC" disabled><UserCog className="h-4 w-4" /></Button> {/* Consider a different icon for KYC if UserCog is for role */}
                            <Button 
                            variant="ghost" 
                            size="icon" 
                            title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                            onClick={() => handleToggleSuspension(user)}
                            disabled={suspendingUserId === user.uid}
                            >
                            {suspendingUserId === user.uid ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isSuspended ? (
                                <PlayCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <UserX className="h-4 w-4 text-destructive" />
                            )}
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUserForRole && (
        <AdminUserRoleDialog
          isOpen={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          user={selectedUserForRole}
          onSuccess={handleRoleUpdateSuccess}
        />
      )}
      {selectedUserForBalance && (
        <AdjustBalanceDialog
          isOpen={isBalanceDialogOpen}
          onOpenChange={setIsBalanceDialogOpen}
          user={selectedUserForBalance}
          onSuccess={handleBalanceUpdateSuccess}
        />
      )}
      {selectedUserForDetail && (
        <ViewUserDetailModal
            isOpen={isDetailModalOpen}
            onOpenChange={setIsDetailModalOpen}
            user={selectedUserForDetail}
        />
      )}
    </div>
  );
}

