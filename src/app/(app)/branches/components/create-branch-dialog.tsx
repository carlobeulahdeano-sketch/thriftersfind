"use client";

import { useState } from "react";
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
import { createBranch } from "../actions";
import { Loader2 } from "lucide-react";

interface CreateBranchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onBranchAdded?: () => void;
}

export function CreateBranchDialog({ isOpen, onClose, onBranchAdded }: CreateBranchDialogProps) {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setName("");
    };

    const handleSave = async () => {
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
            const result = await createBranch({ name });

            if (result.success) {
                toast({
                    title: "Branch Created",
                    description: `Branch "${name}" has been created successfully.`,
                });
                resetForm();
                onClose();
                if (onBranchAdded) {
                    onBranchAdded();
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
                    <DialogTitle>Add New Branch</DialogTitle>
                    <DialogDescription>
                        Create a new branch for the system.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="branch-name">Branch Name</Label>
                        <Input
                            id="branch-name"
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
                                Creating...
                            </>
                        ) : (
                            "Create Branch"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
