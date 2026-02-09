import { getWarehouse, getWarehouseProducts } from "../actions";
import WarehouseProductsTable from "./components/warehouse-products-table";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function WarehouseDetailPage({ params }: { params: { id: string } }) {
    const warehouse = await getWarehouse(params.id);
    const products = await getWarehouseProducts(params.id);

    if (!warehouse) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/warehouses">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Warehouse Not Found</h1>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-4">
                <Link href="/warehouses">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{warehouse.name}</h1>
                    {warehouse.location && (
                        <p className="text-muted-foreground">{warehouse.location}</p>
                    )}
                </div>
            </div>
            <WarehouseProductsTable warehouseId={params.id} products={products} />
        </div>
    );
}
