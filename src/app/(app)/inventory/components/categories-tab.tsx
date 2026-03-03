"use client";

import * as React from "react";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, PlusCircle, FolderOpen, Pencil, Trash2, Image as ImageIcon, X } from "lucide-react";
import type { ProductCategory } from "@/lib/types";
import {
    createCategory,
    updateCategory,
    deleteCategory,
} from "../category-actions";

interface CategoriesTabProps {
    categories: ProductCategory[];
    onRefresh: () => void;
}

export function CategoriesTab({ categories: initialCategories, onRefresh }: CategoriesTabProps) {
    const { toast } = useToast();
    const [categories, setCategories] = React.useState<ProductCategory[]>(initialCategories);
    const [isCreateOpen, setCreateOpen] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<ProductCategory | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Form state
    const [name, setName] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string>("");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview("");
    };

    React.useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setImageFile(null);
        setImagePreview("");
    };

    const openCreate = () => {
        resetForm();
        setCreateOpen(true);
    };

    const openEdit = (category: ProductCategory) => {
        setName(category.name);
        setDescription(category.description || "");
        setImagePreview(category.imageUrl || "");
        setImageFile(null);
        setEditingCategory(category);
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Category name is required." });
            return;
        }
        setIsSubmitting(true);
        try {
            let dataUrl: string | null = null;
            if (imageFile) {
                dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            }

            await createCategory({ name: name.trim(), description: description.trim() || null, imageUrl: dataUrl });
            toast({ title: "Category Created", description: `"${name.trim()}" has been created.` });
            setCreateOpen(false);
            resetForm();
            onRefresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create category.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingCategory) return;
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Category name is required." });
            return;
        }
        setIsSubmitting(true);
        try {
            let dataUrl: string | null = imagePreview && !imageFile ? imagePreview : null;
            if (imageFile) {
                dataUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageFile);
                });
            } else if (!imagePreview) {
                dataUrl = null;
            }

            await updateCategory(editingCategory.id, {
                name: name.trim(),
                description: description.trim() || null,
                imageUrl: dataUrl,
            });
            toast({ title: "Category Updated", description: `"${name.trim()}" has been updated.` });
            setEditingCategory(null);
            resetForm();
            onRefresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update category.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (category: ProductCategory) => {
        try {
            await deleteCategory(category.id);
            toast({ title: "Category Deleted", description: `"${category.name}" has been deleted.` });
            onRefresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete category.",
            });
        }
    };

    return (
        <>
            <Card>
                <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {categories.length} {categories.length === 1 ? "category" : "categories"}
                        </p>
                    </div>
                    <Button onClick={openCreate}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-center">Products</TableHead>
                                <TableHead className="text-right">Created</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {category.imageUrl ? (
                                                <Avatar className="h-10 w-10 border border-border">
                                                    <AvatarImage src={category.imageUrl} alt={category.name} className="object-cover" />
                                                    <AvatarFallback><FolderOpen className="h-4 w-4" /></AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center border border-border">
                                                    <FolderOpen className="h-4 w-4 text-cyan-500" />
                                                </div>
                                            )}
                                            {category.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                                        {category.description || "—"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary">{category._count?.products ?? 0}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {new Date(category.createdAt).toLocaleDateString()}
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
                                                    <DropdownMenuItem onClick={() => openEdit(category)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-red-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete &quot;{category.name}&quot;? This action cannot be undone.
                                                        {(category._count?.products ?? 0) > 0 && (
                                                            <span className="block mt-2 text-destructive font-medium">
                                                                This category has {category._count?.products} product(s) assigned. Remove them first.
                                                            </span>
                                                        )}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(category)}
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
                    {categories.length === 0 && (
                        <div className="text-center p-12 text-muted-foreground">
                            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">No categories yet</p>
                            <p className="text-sm mt-1">Create your first product category to organize your inventory.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Category Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-lg overflow-hidden p-0">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 px-6 py-5">
                        <div className="flex items-center gap-3 text-white">
                            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <FolderOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-lg font-semibold">Create Category</DialogTitle>
                                <DialogDescription className="text-white/80 text-sm">
                                    Add a new product category to organize your inventory.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Form Section */}
                        <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-5 mb-4 border border-purple-200/30 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <h3 className="font-semibold text-sm">Category Details</h3>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="category-name" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        Category Name
                                    </Label>
                                    <Input
                                        id="category-name"
                                        placeholder="e.g. Sneakers, Apparel, Accessories..."
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category-description" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        Description (optional)
                                    </Label>
                                    <Input
                                        id="category-description"
                                        placeholder="Brief description of this category..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="bg-purple-50/50 dark:bg-purple-950/20 rounded-lg p-5 mb-6 border border-purple-200/30 dark:border-purple-800/30">
                            <div className="flex items-center gap-2 mb-4">
                                <ImageIcon className="w-4 h-4 text-purple-500" />
                                <h3 className="font-semibold text-sm">Category Image</h3>
                            </div>
                            <div className="grid gap-2">
                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-purple-300 dark:border-purple-800/50 rounded-md p-6 text-center bg-white dark:bg-gray-950 transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/10">
                                        <Input
                                            id="category-image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <Label htmlFor="category-image" className="cursor-pointer">
                                            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                                                <ImageIcon className="h-6 w-6 text-purple-500" />
                                            </div>
                                            <span className="block text-sm font-medium text-purple-600 dark:text-purple-400">Click to upload image</span>
                                            <span className="block text-xs text-muted-foreground mt-1">Recommended size: 400x400px</span>
                                        </Label>
                                    </div>
                                ) : (
                                    <div className="relative border-2 border-purple-200 dark:border-purple-800/50 rounded-md overflow-hidden bg-white dark:bg-gray-950 w-full max-w-[200px] mx-auto">
                                        <div className="aspect-square bg-muted">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                                            onClick={removeImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {isSubmitting ? "Creating..." : "Create Category"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Category Dialog */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => { if (!open) { setEditingCategory(null); resetForm(); } }}>
                <DialogContent className="sm:max-w-lg overflow-hidden p-0">
                    {/* Gradient Header */}
                    <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-6 py-5">
                        <div className="flex items-center gap-3 text-white">
                            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Pencil className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-white text-lg font-semibold">Edit Category</DialogTitle>
                                <DialogDescription className="text-white/80 text-sm">
                                    Update the category name or description.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Form Section */}
                        <div className="bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg p-5 mb-4 border border-cyan-200/30 dark:border-cyan-800/30">
                            <div className="flex items-center gap-2 mb-4">
                                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <h3 className="font-semibold text-sm">Category Details</h3>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-category-name" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                        Category Name
                                    </Label>
                                    <Input
                                        id="edit-category-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-category-description" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        Description (optional)
                                    </Label>
                                    <Input
                                        id="edit-category-description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="bg-cyan-50/50 dark:bg-cyan-950/20 rounded-lg p-5 mb-6 border border-cyan-200/30 dark:border-cyan-800/30">
                            <div className="flex items-center gap-2 mb-4">
                                <ImageIcon className="w-4 h-4 text-cyan-500" />
                                <h3 className="font-semibold text-sm">Category Image</h3>
                            </div>
                            <div className="grid gap-2">
                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-cyan-300 dark:border-cyan-800/50 rounded-md p-6 text-center bg-white dark:bg-gray-950 transition-colors hover:bg-cyan-50 dark:hover:bg-cyan-900/10">
                                        <Input
                                            id="edit-category-image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                        <Label htmlFor="edit-category-image" className="cursor-pointer">
                                            <div className="h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-3">
                                                <ImageIcon className="h-6 w-6 text-cyan-500" />
                                            </div>
                                            <span className="block text-sm font-medium text-cyan-600 dark:text-cyan-400">Click to upload image</span>
                                        </Label>
                                    </div>
                                ) : (
                                    <div className="relative border-2 border-cyan-200 dark:border-cyan-800/50 rounded-md overflow-hidden bg-white dark:bg-gray-950 w-full max-w-[200px] mx-auto">
                                        <div className="aspect-square bg-muted">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                                            onClick={removeImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => { setEditingCategory(null); resetForm(); }} className="flex-1">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={isSubmitting}
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
