import { getPreOrders, getPreOrderProducts } from "../actions";
import { getCustomers } from "../../customers/actions";
import { getStations } from "../../stations/actions";
import { getBatches } from "../../batches/actions";
import PreOrderTable from "../components/pre-order-table";

export const metadata = {
    title: "Pre-orders | ThriftersFind",
    description: "Manage your pre-orders efficiently.",
};

export default async function PreOrdersPage() {
    const preOrders = await getPreOrders();
    const customers = await getCustomers();
    const products = await getPreOrderProducts();
    const stations = await getStations();
    const batches = await getBatches();

    return (
        <div className="space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">Pre-orders</h2>
                    <p className="text-muted-foreground">
                        Manage and track your upcoming pre-orders.
                    </p>
                </div>
            </div>

            <PreOrderTable
                orders={preOrders}
                customers={customers}
                products={products}
                products={products}
                stations={stations}
                batches={batches}
            />
        </div>
    );
}
