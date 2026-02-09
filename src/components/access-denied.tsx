"use client";

import React from "react";
import { Button } from "./ui/button";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccessDenied() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
            <div className="mb-6 p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-4">
                Access Denied
            </h1>
            <p className="text-muted-foreground max-w-md mb-8">
                You do not have permission to access this section. Please contact your administrator if you believe this is an error.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    className="rounded-full px-8"
                >
                    Go Back
                </Button>
                <Button
                    onClick={() => window.location.href = "/profile"}
                    className="rounded-full px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-none text-white shadow-lg shadow-blue-500/20"
                >
                    Go to Profile
                </Button>
            </div>
        </div>
    );
}
