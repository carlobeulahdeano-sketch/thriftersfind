"use client";

import { Button } from "@/components/ui/button";

export function ReloadButton() {
    return (
        <Button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
            Try Again
        </Button>
    );
}
