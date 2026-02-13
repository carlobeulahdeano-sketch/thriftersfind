
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import UsersTable from "./components/users-table";
import { getUsers, getAuthenticatedUser } from "./actions";
import type { User } from "@/lib/types";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [userData, authData] = await Promise.all([
          getUsers(),
          getAuthenticatedUser()
        ]);
        setUsers(userData);
        setCurrentUser(authData.user);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserAdded = async () => {
    // Refresh the users list after adding a new user
    try {
      const updatedUsers = await getUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage system access and roles.
          </p>
        </div>
      </div>
      <UsersTable
        users={users}
        currentUser={currentUser}
        onUserAdded={handleUserAdded}
        onUserUpdated={handleUserAdded}
      />
    </div>
  );
}
