
export const dynamic = 'force-dynamic';

import BodegaInventoryTable from "./components/bodega-inventory-table";
import { getBodegaProducts } from "./actions";

export default async function BodegaInventoryPage() {
    const products = await getBodegaProducts();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Bodega Inventory</h1>
            </div>
            <BodegaInventoryTable
                products={products}
            />
        </div>
    );
}
