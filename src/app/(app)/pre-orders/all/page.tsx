export const dynamic = 'force-dynamic';

import { getPreOrders } from "../actions";
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
    const stations = await getStations();
    const { batches } = await getBatches();

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                        Pre-orders
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage and track your upcoming pre-orders.
                    </p>
                </div>
            </div>

            <PreOrderTable
                orders={preOrders}
                customers={customers}
                stations={stations}
                batches={batches}
            />
        </div>
    );
}
