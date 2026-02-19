"use client";

import { useEffect, useState } from "react";
import WarehouseProductsTable from "./components/warehouses-table";
import { getWarehouseProducts } from "./actions";
import type { WarehouseProduct } from "@/lib/types";

export default function WarehousesPage() {
    const [products, setProducts] = useState<WarehouseProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) throw new Error('Auth failed');
            const { user } = await response.json();

            if (!user?.permissions?.warehouses) {
                setIsAuthorized(false);
            }

            if (user?.permissions?.warehouses) {
                const productsData = await getWarehouseProducts();
                setProducts(productsData);
            }
        } catch (error) {
            console.error("Error fetching warehouse products:", error);
        } finally {
            setHasCheckedPermission(true);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (!hasCheckedPermission || isLoading) {
        return (
            <div className="flex flex-col gap-8 p-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                            Warehouse Inventory
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your warehouse stock and inventory
                        </p>
                    </div>
                </div>
                <div className="flex items-center justify-center p-8">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <svg className="h-10 w-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view warehouse inventory.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                        Warehouse Inventory
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your warehouse stock and inventory
                    </p>
                </div>
            </div>
            <WarehouseProductsTable products={products} onRefresh={fetchData} />
        </div>
    );
}
