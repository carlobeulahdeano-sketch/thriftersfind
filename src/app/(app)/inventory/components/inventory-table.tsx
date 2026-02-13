
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
import { MoreHorizontal, PlusCircle, Search, X, Image as ImageIcon, AlertTriangle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddProductDialog } from "./add-product-dialog";
import { AddQuantityDialog } from "./add-quantity-dialog";
import { DeductQuantityDialog } from "./deduct-quantity-dialog";
import type { Product, InventoryItem } from "@/lib/types";
import { EditProductDialog } from "./edit-product-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteProduct } from "../actions";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export default function InventoryTable({ products: initialProducts }: { products: Product[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [addingQuantityProduct, setAddingQuantityProduct] = React.useState<Product | null>(null);
  const [deductingQuantityProduct, setDeductingQuantityProduct] = React.useState<Product | null>(null);

  const refreshProducts = () => {
    router.refresh();
  };

  React.useEffect(() => {
    let filtered = initialProducts;
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, initialProducts]);

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);

      toast({
        title: "Product Deleted",
        description: "The product has been removed from the inventory.",
      });

      refreshProducts();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product. Please try again.",
      });
    }
  }

  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const isFiltered = searchTerm !== "";

  const resetFilters = () => {
    setSearchTerm("");
  }



  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name or SKU..."
                className="pl-8 sm:w-[250px]"
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
                <TableHead className="w-[80px] font-semibold">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Total Qty</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Retail Price</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className={product.totalStock === 0 ? "bg-red-50 dark:bg-red-950/20" : ""}
                >
                  <TableCell>
                    <div className="h-12 w-12 overflow-hidden rounded-xl border-2 border-white/10 bg-muted/50 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-pink-500/50 cursor-pointer group">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.sku}</Badge>
                  </TableCell>
                  <TableCell className="text-center">{product.totalStock}</TableCell>
                  <TableCell className="text-center">
                    {product.totalStock === 0 ? (
                      <Badge variant="outline" className="w-fit mx-auto flex items-center justify-center gap-1 border-red-500 text-red-500">
                        <X className="h-3 w-3" />
                        Out of Stock
                      </Badge>
                    ) : product.totalStock <= product.alertStock ? (
                      <Badge variant="destructive" className="w-fit mx-auto flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge variant="secondary">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₱{product.retailPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>

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
                          <DropdownMenuItem onClick={() => setAddingQuantityProduct(product)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeductingQuantityProduct(product)}>
                            <MinusCircle className="mr-2 h-4 w-4" />
                            Deduct Stock
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>Edit</DropdownMenuItem>
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
                            from the inventory.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
            Page {currentPage} of {totalPages}
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
      <AddProductDialog
        isOpen={isAddDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={refreshProducts}
      />
      <EditProductDialog
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onSuccess={refreshProducts}
      />
      <AddQuantityDialog
        isOpen={!!addingQuantityProduct}
        onClose={() => setAddingQuantityProduct(null)}
        product={addingQuantityProduct}
        onSuccess={refreshProducts}
      />
      <DeductQuantityDialog
        isOpen={!!deductingQuantityProduct}
        onClose={() => setDeductingQuantityProduct(null)}
        product={deductingQuantityProduct}
        onSuccess={refreshProducts}
      />
    </>
  );
}
