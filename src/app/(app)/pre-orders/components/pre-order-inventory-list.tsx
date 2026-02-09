"use client";

import * as React from "react";
import { PlusCircle, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Mock data type for Pre-order Inventory
interface PreOrderProduct {
    id: string;
    name: string;
    price: number;
    image: string; // Placeholder for now
}

// Mock data
const MOCK_PREORDER_PRODUCTS: PreOrderProduct[] = [
    { id: "1", name: "Vintage Denim Jacket", price: 1500, image: "/placeholder-jacket.jpg" },
    { id: "2", name: "Levis 501 Original", price: 2500, image: "/placeholder-jeans.jpg" },
    { id: "3", name: "Graphic Tee Collection", price: 800, image: "/placeholder-tee.jpg" },
];

export function PreOrderInventoryList() {
    const [searchTerm, setSearchTerm] = React.useState("");

    const filteredProducts = MOCK_PREORDER_PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search pre-order products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Details</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <span>{product.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">₱{product.price.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                * These items are separate from main inventory and are not yet in stock.
            </p>
        </div>
    );
}
