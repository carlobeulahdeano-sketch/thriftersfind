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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { updateUser, getBranches, getRoles } from "../actions";
import { User, Branch, UserPermissions, Role } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated?: () => void;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: true,
  orders: true,
  batches: true,
  inventory: true,
  customers: true,
  reports: true,
  users: false,
  settings: false,
  adminManage: false,
  stations: false,
  preOrders: false,
  warehouses: false,
  sales: false,
};

const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  dashboard: "Dashboard",
  orders: "Orders",
  batches: "Batches",
  inventory: "Inventory",
  customers: "Customers",
  reports: "Reports",
  users: "Users",
  settings: "Settings",
  adminManage: "Admin Manage",
  stations: "Courier & Pickup Stations",
  preOrders: "Pre order",
  warehouses: "Warehouses",
  sales: "Sales",
};

export function EditUserDialog({ isOpen, onClose, user, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_PERMISSIONS);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRoleId(user.roleId || "");
      setBranchId(user.branchId || "");
      setPermissions({
        ...DEFAULT_PERMISSIONS,
        ...(user.permissions || {})
      });
      setPassword(""); // Don't populate password for security
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      async function fetchData() {
        const [fetchedBranches, fetchedRoles] = await Promise.all([
          getBranches(),
          getRoles()
        ]);
        setBranches(fetchedBranches);
        setRoles(fetchedRoles);
      }
      fetchData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setRoleId("");
    setBranchId("");
    setPermissions(DEFAULT_PERMISSIONS);
  };

  const handleTogglePermission = (feature: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!name || !email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out name and email fields.",
      });
      return;
    }

    if (password && password.length > 0 && password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    const result = await updateUser(user.id, {
      name,
      email,
      password: password || undefined,
      roleId: roleId || undefined,
      branchId: branchId || undefined,
      permissions,
    });

    if (result.user) {
      toast({
        title: "User Updated",
        description: `Account for ${name} has been updated successfully.`,
      });

      resetForm();
      onClose();

      if (onUserUpdated) {
        onUserUpdated();
      }
    } else {
      toast({
        title: "Warning",
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user account information and system access.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          {/* Left Side: Access Features */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">SELECTING ACCESS FEATURES</h3>
            <div className="grid gap-4 bg-muted/30 p-4 rounded-lg">
              {Object.entries(permissions).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between">
                  <Label htmlFor={`edit-feature-${feature}`} className="cursor-pointer">
                    {PERMISSION_LABELS[feature as keyof UserPermissions]}
                  </Label>
                  <Switch
                    id={`edit-feature-${feature}`}
                    checked={enabled}
                    onCheckedChange={() => handleTogglePermission(feature as keyof UserPermissions)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="md:hidden" />

          {/* Right Side: User Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">USER INFORMATION</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
                <Input id="edit-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-branch">Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Branch</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
