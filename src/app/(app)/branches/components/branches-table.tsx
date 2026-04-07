"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { BranchData, deleteBranch } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { CreateBranchDialog } from "./create-branch-dialog";
import { EditBranchDialog } from "./edit-branch-dialog";
import { format } from "date-fns";
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

interface BranchesTableProps {
    branches: BranchData[];
    onRefresh: () => void;
}

export default function BranchesTable({ branches, onRefresh }: BranchesTableProps) {
    const { toast } = useToast();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async () => {
        if (!selectedBranch) return;

        setIsLoading(true);
        try {
            const result = await deleteBranch(selectedBranch.id);
            if (result.success) {
                toast({
                    title: "Branch Deleted",
                    description: "Branch has been deleted successfully.",
                });
                onRefresh();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
            setIsDeleteOpen(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Branch
                </Button>
            </div>

            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="font-bold py-4">Name</TableHead>
                                <TableHead className="font-bold">Created At</TableHead>
                                <TableHead className="font-bold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <MapPin className="w-8 h-8 opacity-20" />
                                            <p>No branches found. Add your first branch!</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((branch) => (
                                    <TableRow key={branch.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                </div>
                                                {branch.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(branch.createdAt), "MMM dd, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedBranch(branch);
                                                            setIsEditOpen(true);
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedBranch(branch);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CreateBranchDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onBranchAdded={onRefresh}
            />

            <EditBranchDialog
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                branch={selectedBranch}
                onBranchUpdated={onRefresh}
            />

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the branch "{selectedBranch?.name}". 
                            This action cannot be undone and will only work if the branch has no associated users or products.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
