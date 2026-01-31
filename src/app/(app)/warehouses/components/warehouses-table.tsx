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
import { MoreHorizontal, PlusCircle, Search, X, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AddWarehouseDialog } from "./add-warehouse-dialog";
import { ViewWarehouseDialog } from "./view-warehouse-dialog";
import { EditWarehouseDialog } from "./edit-warehouse-dialog";
import type { WarehouseProduct } from "../actions";
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

export default function WarehouseProductsTable({ products: initialProducts }: { products: WarehouseProduct[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [products, setProducts] = React.useState<WarehouseProduct[]>(initialProducts);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
    const [editingProduct, setEditingProduct] = React.useState<WarehouseProduct | null>(null);
    const [viewingProduct, setViewingProduct] = React.useState<WarehouseProduct | null>(null);

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
                    (product.location && product.location.toLowerCase().includes(searchTerm.toLowerCase()))
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
                description: "The warehouse product has been removed successfully.",
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
                                placeholder="Search by name, SKU, or location..."
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
                                <TableHead className="w-[80px]">Image</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Manufacture Date</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Retail Price</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="h-10 w-10 overflow-hidden rounded-md border bg-muted">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {product.productName}
                                    </TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>
                                        {product.manufacture_date ? new Date(product.manufacture_date).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell>{product.location || "—"}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>${product.cost.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {product.retailPrice ? `$${product.retailPrice.toFixed(2)}` : "—"}
                                    </TableCell>
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
                                                    <DropdownMenuItem onClick={() => setViewingProduct(product)}>
                                                        View Details
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
                            No products found.
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

            <AddWarehouseDialog
                isOpen={isAddDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSuccess={refreshProducts}
            />
            {editingProduct && (
                <EditWarehouseDialog
                    isOpen={!!editingProduct}
                    onClose={() => setEditingProduct(null)}
                    product={editingProduct}
                    onSuccess={refreshProducts}
                />
            )}
            {viewingProduct && (
                <ViewWarehouseDialog
                    isOpen={!!viewingProduct}
                    onClose={() => setViewingProduct(null)}
                    product={viewingProduct}
                />
            )}
        </>
    );
}
