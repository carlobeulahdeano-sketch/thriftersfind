"use client";

import { useEffect, useState } from "react";
import { getBranches, BranchData } from "./actions";
import BranchesTable from "./components/branches-table";
import { MapPin, Loader2, AlertTriangle } from "lucide-react";

export default function BranchesPage() {
    const [branches, setBranches] = useState<BranchData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

    const refreshBranches = async () => {
        setIsLoading(true);
        try {
            const data = await getBranches();
            setBranches(data);
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/auth/me');
                if (!response.ok) throw new Error('Auth failed');
                const { user } = await response.json();

                // Check for branches permission
                if (!user?.permissions?.branches && user?.role?.name?.toLowerCase() !== 'super admin') {
                    setIsAuthorized(false);
                }

                if (user?.permissions?.branches || user?.role?.name?.toLowerCase() === 'super admin') {
                    const data = await getBranches();
                    setBranches(data);
                }
            } catch (error) {
                console.error("Error checking permissions:", error);
                setIsAuthorized(false);
            } finally {
                setHasCheckedPermission(true);
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    if (!hasCheckedPermission || (isLoading && branches.length === 0)) {
        return (
            <div className="flex flex-col gap-8 p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                            Branch Management
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your application branches
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center p-12 gap-4 bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/50">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-slate-500 font-medium">Loading branches...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-center max-w-md mx-auto">
                <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-lg shadow-destructive/10 animate-pulse">
                    <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground text-lg">
                        You do not have the required permissions to manage branches. Please contact your system administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-10 p-2">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-200">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                            Branch Management
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg ml-13">
                        Configure and manage your business locations
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative">
                {/* Decorative background element */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
                
                <BranchesTable branches={branches} onRefresh={refreshBranches} />
            </div>
        </div>
    );
}
