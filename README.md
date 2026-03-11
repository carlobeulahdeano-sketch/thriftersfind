# ThriftersFind Order Management System (OMS)

This document outlines the core processes and functionality of the ThriftersFind Order Management System. The system is designed for internal administrative use and revolves around a batch-based delivery schedule.

## 1. Authentication and User Roles

The system implements two user roles with defined permissions to ensure proper access control and accountability.

### Super Admin

**Purpose**: Overall system management and user administration.

**Permissions**:
- Full access to all modules and data.
- Create, update, or deactivate admin accounts.
- Manage courier settings and delivery schedules.
- View and export business reports.

**Credentials**:
- **Email**: `admin@example.com`
- **Password**: `password`

### Admin / Encoder

**Purpose**: Daily operational use — recording and managing orders.

**Permissions**:
- Create and edit orders.
- Assign or hold orders for future batches.
- Manage customers.
- View delivery schedules and reports (read-only).
- Cannot create or manage user accounts.

## 2. Dashboard

The Dashboard serves as the system’s home page, giving real-time insights into operational performance.

### Key Features

- **Summary Cards**:
  - Total Sales
  - Total Orders
  - New Customers
  - Held Orders
- **Sales Overview Chart**: Filterable by week, month, or year.
- **Batch Summary**: Quick view of open, closed, and completed delivery batches.
- **Recent Orders Table**: Shows the latest orders with status and amount.

## 3. Batch & Delivery Scheduling Management

This is the core enhancement designed specifically for ThriftersFind’s weekly delivery process.

### Batch Overview

Each batch represents a delivery cycle, e.g.:
- “Week 42 - Saturday Delivery”
- “Week 42 - Tuesday Delivery”

### Fields

- Batch Name / Code
- Delivery Date
- Cutoff Date
- Status (Open, Closed, Delivered, Cancelled)
- Total Orders
- Total Sales

### Admin Actions

- Create new delivery batches.
- Assign orders to a batch.
- Reassign or move orders between batches.
- Close a batch when cutoff is reached.
- Mark a batch as “Delivered” once shipments are complete.

### Batch Dashboard

Each batch page displays:
- Summary statistics.
- Orders assigned to the batch.
- Customers included in the batch.
- Delivery schedule (Tuesday / Saturday).
- Courier breakdown.

## 4. Order Management

The Orders module provides full control over the order lifecycle — from encoding to delivery.

### Create Order

When creating an order:
- Search for an existing customer or create a new one.
- Enter product details, quantity, and total amount.
- Choose payment method (COD, GCash, Bank Transfer).
- **Select Delivery Option**:
  - Assign to Current Batch (e.g., “Saturday Delivery”)
  - Hold for Next Batch
- If “Hold” is selected, the order will not appear in any active batch until reassigned.

### Order Fields

- Order ID
- Customer Name / ID
- Payment Method
- Payment Status (Paid, Unpaid, Hold)
- Shipping Status (Pending, Ready, Shipped, Delivered, Cancelled)
- Delivery Day (Tuesday, Saturday)
- Total Amount
- Batch ID (if assigned)
- Created Date

### Edit & Manage Orders

- Update order status, payment info, or delivery schedule.
- Bulk assign multiple “Held” orders to a new batch.
- Filter orders by date, batch, payment, or shipping status.

## 5. Customer Management

The Customers page serves as a directory of all active buyers.

### Features

- **Customer List**: View, search, and filter by name or activity.
- **Customer Profile View**: Displays:
  - Basic info (name, contact, address)
  - Total lifetime value (₱)
  - Order count
  - Held orders
  - Recent order history
- **Add or Edit Customer**: Admins can manually create or modify customer profiles.

### Special Filters

- Customers with active held orders
- Customers in upcoming delivery batches

## 6. User Management (Super Admin Only)

Accessible only by the Super Admin.

### Features

- View all system users with role labels (`super admin`, `admin`).
- Create new admin users with name, email, and password.
- Reset or deactivate accounts.
- View login activity logs.

## 7. Reports & Analytics

Comprehensive analytics designed for weekly review and business tracking.

### Sections

- **Sales Over Time**: Filter by week, month, or year.
- **Batch Comparison**: View sales difference between recent batches.
- **Top Customers**: Highlight top 5 spenders.
- **Courier Distribution**: Breakdown of shipments per courier.
- **Held Orders Report**: Summary of orders pending delivery.

### Export Options

- Export data to Excel or PDF for reporting and bookkeeping.
## 8. Networking

The system uses **Tailscale** for secure internal networking. This ensures that the application can communicate with the database and other services regardless of the physical location of the devices, provided they are part of the same Tailnet.

### Key Nodes
- **Database Server**: `100.101.241.108` (server)
- **Local Dev/Client**: `100.95.122.21` (desktop)
- **Other Node**: `100.65.142.68` (thrifte)

### Requirements
- Tailscale must be installed and running on the host machine.
- The machine must be authenticated to the ThriftersFind Tailnet.

### Connection Utility
You can verify the network status and connectivity to the database server using the following command:
```bash
node scripts/check-network.js
```

---
