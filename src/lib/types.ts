export type SalesData = {
  date: string;
  totalAmount: number;
};

export type TopCustomerData = {
  name: string;
  totalSpent: number;
};

export type CourierData = {
  name: string;
  count: number;
};

export type InventoryItem = {
  id: string | number;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  totalStock: number;
  alertStock: number;
  cost: number;
  retailPrice: number;
  images: string[];
};

export type UserRole = 'admin' | 'super admin' | 'overseer' | 'packer' | 'user' | 'staff';

export type UserPermissions = {
  dashboard: boolean;
  orders: boolean;
  batches: boolean;
  inventory: boolean;
  customers: boolean;
  reports: boolean;
  users: boolean;
  settings: boolean;
  adminManage: boolean;
  stations: boolean;
  preOrders: boolean;
  warehouses: boolean;
  sales: boolean;
  branches: boolean;
};

export type User = {
  id: string | number;
  name: string;
  email: string;
  password: string;
  roleId?: string | number | null;
  role?: Role | null;
  branchId?: string | number | null;
  branch?: Branch | null;
  permissions?: UserPermissions | null;
  isActive?: boolean;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Role = {
  id: string | number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Branch = {
  id: string | number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderHistoryItem = {
  orderId: string | number;
  date: string;
  amount: number;
  items: string;
  year: number;
  paymentMethod: string;
  shippingStatus: string;
};

export type YearlyOrderSummary = {
  year: number;
  totalOrders: number;
  totalSpent: number;
  orders: OrderHistoryItem[];
};

export type Customer = {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  orderHistory: OrderHistoryItem[];
  totalSpent: number;
  role?: UserRole;
  isActive?: boolean;
};

export type PaymentStatus = 'Hold' | 'Paid' | 'Unpaid' | 'PAID PENDING';
export type ShippingStatus = 'Pending' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Claimed' | 'Rush Ship';
export type OrderRemark = 'PLUS Branch 1' | 'PLUS Branch 2' | 'PLUS Warehouse' | '';


export type PaymentMethod = 'COD' | 'GCash' | 'Bank Transfer';

export type OrderItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string | number; // Order ID / Reference No.
  customerName: string;
  contactNumber: string;
  address: string; // Address / Location
  orderDate: string;
  itemName: string; // Item Name / Description
  items?: OrderItem[];
  quantity: number;
  price: number; // Price per Item
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  batchId: string | number | null;
  createdAt?: any; // Timestamp
  createdBy?: {
    uid: string | number;
    name: string;
  };
  customerId: string | number;
  customerEmail?: string;
  courierName?: string;
  trackingNumber?: string;
  remarks?: OrderRemark;
  rushShip: boolean;
  batch?: Batch;
};

export type Batch = {
  id: string | number;
  batchName: string;
  manufactureDate: string;
  status: 'Open' | 'Closed' | 'Delivered' | 'Cancelled';
  totalOrders: number;
  totalSales: number;
}

export type ProductCategory = {
  id: string | number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export type Product = {
  id: string | number;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  warehouseId?: string | number | null;
  categoryId?: string | number | null;
  branchId?: string | number | null;
  category?: ProductCategory | null;
  totalStock: number;
  alertStock: number;
  cost: number;
  retailPrice: number;
  images: string[];
}

export type PreOrderProduct = {
  id: string | number;
  name: string;
  sku: string;
  description: string | null;
  quantity: number;
  alertStock: number;
  cost: number;
  retailPrice: number | null;
  images: string[] | null;
  createdAt: string;
  updatedAt: string;
}


export type Station = {
  id: string | number;
  name: string;
  location: string;
  type: string;
  contactNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
};

export type PreOrder = {
  id: string | number;
  customerName: string;
  contactNumber: string | null;
  address: string | null;
  orderDate: Date | string | null;
  totalAmount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  depositAmount: number | null;
  customerId: string | number;
  customerEmail: string | null;
  remarks: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer?: Customer;
  items: PreOrderItem[];
  batchId?: string | number | null;
  batch?: Batch;
  salesLogs?: any[];
};

export type PreOrderItem = {
  id: string | number;
  preOrderId: string | number;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  images?: any;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type InventoryLog = {
  id: string | number;
  action: string;
  productId?: string | number | null;
  warehouseProductId?: string | number | null;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  referenceId?: string | null;
  performedBy?: any; // Json
  createdAt: string | Date;
  orderId?: string | number | null;
  preOrderId?: string | number | null;
  userId?: string | number | null;
  branchId?: string | number | null;

  product?: Product | null;
  warehouseProduct?: { productName: string; sku: string } | null;
  order?: { id: string | number; } | null;
  preOrder?: { id: string | number; } | null;
  user?: { name: string; email: string } | null;
  branch?: { name: string; } | null;
};

export type WarehouseProduct = {
  id: string | number;
  warehouseId?: string | number | null;
  productName: string;
  sku: string;
  quantity: number;
  manufacture_date?: Date | string | null;
  image?: string | null;
  location?: string | null;
  cost: number;
  retailPrice?: number | null;
  batchId?: string | number | null;
  images?: any;
  createdBy?: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  alertStock?: number;
  manufacturer?: string | null;
  productId?: string | number | null;
};
