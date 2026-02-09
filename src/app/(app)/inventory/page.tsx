
export const dynamic = 'force-dynamic';

import InventoryTable from "./components/inventory-table";
import { getProducts } from "./actions";

export default async function InventoryPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Product Inventory</h1>
      </div>
      <InventoryTable
        products={products}
      />
    </div>
  );
}
