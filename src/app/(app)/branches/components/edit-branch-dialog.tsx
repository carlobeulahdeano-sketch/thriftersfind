"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateBranch } from "../actions";
import { Loader2 } from "lucide-react";
import { BranchData } from "../actions";

interface EditBranchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    branch: BranchData | null;
    onBranchUpdated?: () => void;
}

export function EditBranchDialog({ isOpen, onClose, branch, onBranchUpdated }: EditBranchDialogProps) {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (branch) {
            setName(branch.name);
        }
    }, [branch]);

    const handleSave = async () => {
        if (!branch) return;

        if (!name.trim()) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please enter a branch name.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateBranch(branch.id, { name });

            if (result.success) {
                toast({
                    title: "Branch Updated",
                    description: `Branch has been updated successfully.`,
                });
                onClose();
                if (onBranchUpdated) {
                    onBranchUpdated();
                }
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
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Branch</DialogTitle>
                    <DialogDescription>
                        Update branch information.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-branch-name">Branch Name</Label>
                        <Input
                            id="edit-branch-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter branch name"
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            "Update Branch"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
