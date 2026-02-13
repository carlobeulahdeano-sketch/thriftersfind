
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { MoreHorizontal, PlusCircle, Search, X, Package, ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddWarehouseProductDialog } from "./add-warehouse-product-dialog";
import { EditWarehouseProductDialog } from "./edit-warehouse-product-dialog";
import { TransferToInventoryDialog } from "./transfer-to-inventory-dialog";
import { WarehouseProduct } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { deleteWarehouseProduct } from "../actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function WarehouseProductsTable({
    warehouseId,
    products: initialProducts
}: {
    warehouseId: string;
    products: WarehouseProduct[]
}) {
    const { toast } = useToast();
    const router = useRouter();
    const [products, setProducts] = React.useState<WarehouseProduct[]>(initialProducts);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<WarehouseProduct | null>(null);
    const [transferringProduct, setTransferringProduct] = React.useState<WarehouseProduct | null>(null);

    const refreshProducts = () => {
        router.refresh();
    };

    React.useEffect(() => {
        let filtered = initialProducts;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (product) =>
                    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (product.manufacturer && product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setProducts(filtered);
        setCurrentPage(1);
    }, [searchTerm, initialProducts]);

    const handleDelete = async (productId: string) => {
        try {
            const result = await deleteWarehouseProduct(productId);

            if (!result.success) {
                throw new Error(result.error || "Failed to delete product");
            }

            toast({
                title: "Product Deleted",
                description: "The product has been removed from warehouse.",
            });

            refreshProducts();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
            });
        }
    };

    const paginatedProducts = products.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(products.length / itemsPerPage);

    const isFiltered = searchTerm !== "";

    const resetFilters = () => {
        setSearchTerm("");
    };

    return (
        <>
            <Card>
                <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, SKU, or manufacturer..."
                                className="pl-8 sm:w-[300px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {isFiltered && (
                            <Button variant="ghost" onClick={resetFilters}>
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button onClick={() => setAddDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Product
                    </Button>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Manufacturer</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            {product.productName}
                                        </div>
                                    </TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>
                                        <Badge variant={product.quantity > 0 ? "secondary" : "outline"}>
                                            {product.quantity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{product.manufacturer || "—"}</TableCell>
                                    <TableCell>{product.location || "—"}</TableCell>
                                    <TableCell>₱{product.cost.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setTransferringProduct(product)}>
                                                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                                                        Transfer to Inventory
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the product
                                                        from the warehouse.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(product.id)}
                                                        className="bg-destructive hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {paginatedProducts.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No products found in this warehouse.
                        </div>
                    )}
                </CardContent>
                <div className="flex items-center justify-between gap-4 p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <AddWarehouseProductDialog
                warehouseId={warehouseId}
                isOpen={isAddDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSuccess={refreshProducts}
            />
            <EditWarehouseProductDialog
                isOpen={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                product={editingProduct}
                onSuccess={refreshProducts}
            />
            <TransferToInventoryDialog
                isOpen={!!transferringProduct}
                onClose={() => setTransferringProduct(null)}
                product={transferringProduct}
                onSuccess={refreshProducts}
            />
        </>
    );
}
