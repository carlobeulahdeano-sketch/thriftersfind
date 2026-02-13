import { NextRequest, NextResponse } from 'next/server';
import { getCustomers, createCustomer } from '@/app/(app)/customers/actions';

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const customers = await getCustomers();
    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerData = body;

    const newCustomer = await createCustomer(customerData);
    return NextResponse.json(
      { success: true, data: newCustomer },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating customer:', error);

    // Handle specific error types
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { success: false, error: 'Database connection error. Please try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
