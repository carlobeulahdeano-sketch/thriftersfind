
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, sku: true, quantity: true, alertStock: true, createdAt: true }
        });

        const whProducts = await prisma.warehouseProduct.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, productName: true, sku: true, quantity: true, alertStock: true, productId: true, createdAt: true }
        });

        return NextResponse.json({ products, whProducts });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
