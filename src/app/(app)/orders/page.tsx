
import OrderTable from "./components/order-table";
import { getOrders } from "./actions";
import { getCustomers } from "../customers/actions";
import { getProducts } from "../inventory/actions";
import { getStations } from "../stations/actions";
import { getBatches } from "../batches/actions";

export default async function OrdersPage() {
  const orders = await getOrders();
  const customers = await getCustomers();
  const products = await getProducts();
  const stations = await getStations();
  const { batches } = await getBatches();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
      </div>
      <OrderTable
        orders={orders}
        customers={customers}
        products={products}
        stations={stations}
        batches={batches}
      />
    </div>
  );
}
