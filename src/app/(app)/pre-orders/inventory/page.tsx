export const dynamic = 'force-dynamic';

import { getPreOrderItems } from "../actions";
// import { getProducts } from "../../inventory/actions";
// import { getBatches } from "../../batches/actions";
import PreOrderInventoryGrid from "../components/pre-order-inventory-grid";

export const metadata = {
    title: "Pre-order Inventory | ThriftersFind",
    description: "Manage your pre-order inventory.",
};

export default async function PreOrderInventoryPage() {
    const products = await getPreOrderItems();
    // const batches = await getBatches(); 

    return (
        <div className="flex flex-col gap-8 p-2">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-fit pb-1">
                        Pre-order Inventory
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Manage stock levels for your pre-order items.
                    </p>
                </div>
            </div>
            {/* @ts-ignore - fixing types next */}
            <PreOrderInventoryGrid products={products} />
        </div>
    );
}
