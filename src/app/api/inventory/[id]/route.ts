import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProduct, deleteProduct } from '@/app/(app)/inventory/actions';

// GET /api/inventory/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform the product data to match the expected format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantity: product.quantity,
      warehouseId: product.warehouseId,
      totalStock: product.quantity,
      alertStock: product.alertStock,
      cost: product.cost,
      retailPrice: product.retailPrice || 0,
      images: product.images ? (product.images as unknown as string[]) : [],
    };

    return NextResponse.json({ success: true, data: transformedProduct });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/[id] - Update a specific product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const body = await request.json();

    const updatedProduct = await updateProduct(productId, body);
    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/[id] - Delete a specific product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    await deleteProduct(productId);
    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete product';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
