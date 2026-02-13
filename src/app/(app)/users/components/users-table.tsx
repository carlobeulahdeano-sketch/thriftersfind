
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, PlusCircle, Search, X } from "lucide-react";
import type { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { deleteUser, getUsers } from "../actions";
import { useToast } from "@/hooks/use-toast";

interface UsersTableProps {
  users: User[];
  currentUser?: User | null;
  onUserAdded?: () => void;
  onUserUpdated?: () => void;
}

export default function UsersTable({ users: initialUsers, currentUser, onUserAdded, onUserUpdated }: UsersTableProps) {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  // ... (rest of state items are unchanged)


  // ... (rest of logic)
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [isCreateDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setEditDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = React.useState(false);

  const { toast } = useToast();

  React.useEffect(() => {
    let filtered = initialUsers;
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, initialUsers]);

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(users.length / itemsPerPage);

  const isFiltered = searchTerm !== "";

  const resetFilters = () => {
    setSearchTerm("");
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    // Slight delay to ensure dropdown closes and focus stabilizes
    setTimeout(() => {
      setEditDialogOpen(true);
    }, 50);
  }

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteAlertOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const result = await deleteUser(userToDelete.id);
      if (result.success) {
        toast({
          title: "User deleted",
          description: `${userToDelete.name} has been deleted successfully.`,
        });
        if (onUserUpdated) {
          onUserUpdated();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete user.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setDeleteAlertOpen(false);
      setUserToDelete(null);
    }
  }

  return (
    <>
      <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
        <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 sm:w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isFiltered && (
              <Button variant="ghost" onClick={resetFilters}>
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white" onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">User</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Created</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="grid gap-0.5">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role?.name === 'super admin' ? 'default' : 'secondary'} className="capitalize">
                      {user.role?.name || 'No Role'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.branch?.name || 'No Branch'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleEditUser(user)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => handleDeleteClick(user)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {paginatedUsers.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              No users found.
            </div>
          )}
        </CardContent>
        <div className="flex items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card >
      <CreateUserDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onUserAdded={onUserAdded}
      />
      <EditUserDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        user={selectedUser}
        onUserUpdated={onUserUpdated}
      />
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              {userToDelete && <span className="font-medium text-foreground"> {userToDelete.name}</span>} and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
