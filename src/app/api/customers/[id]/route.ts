import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/types';

// GET /api/customers/[id] - Get a specific customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Transform the customer data to match the expected format
    const transformedCustomer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      avatar: customer.avatar || "",
      address: customer.street ? {
        street: customer.street,
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
      } : {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
      orderHistory: customer.orderHistory ? (customer.orderHistory as any) : [],
      totalSpent: customer.totalSpent || 0,
      role: customer.role as UserRole | undefined,
    };

    return NextResponse.json({ success: true, data: transformedCustomer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update a specific customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await request.json();

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Update fields if provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.address) {
      updateData.street = body.address.street;
      updateData.city = body.address.city;
      updateData.state = body.address.state;
      updateData.zip = body.address.zip;
    }
    if (body.orderHistory !== undefined) updateData.orderHistory = body.orderHistory;
    if (body.totalSpent !== undefined) updateData.totalSpent = body.totalSpent;
    if (body.role !== undefined) updateData.role = body.role;

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    // Transform the customer data
    const transformedCustomer = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      phone: updatedCustomer.phone || "",
      avatar: updatedCustomer.avatar || "",
      address: updatedCustomer.street ? {
        street: updatedCustomer.street,
        city: updatedCustomer.city || "",
        state: updatedCustomer.state || "",
        zip: updatedCustomer.zip || "",
      } : {
        street: "",
        city: "",
        state: "",
        zip: "",
      },
      orderHistory: updatedCustomer.orderHistory ? (updatedCustomer.orderHistory as any) : [],
      totalSpent: updatedCustomer.totalSpent || 0,
      role: updatedCustomer.role as UserRole | undefined,
    };

    return NextResponse.json({ success: true, data: transformedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete a specific customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Delete the customer
    await prisma.customer.delete({
      where: { id: customerId }
    });

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
