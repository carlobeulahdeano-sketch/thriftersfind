import { prisma as db } from "@/lib/prisma";
import { InventoryLogsTable } from "./components/inventory-logs-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InventoryLogsPage() {
    const branches = await db.branch.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Inventory Logs</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Log History</CardTitle>
                </CardHeader>
                <CardContent>
                    <InventoryLogsTable branches={branches.map(b => ({
                        id: b.id,
                        name: b.name,
                        createdAt: b.createdAt.toISOString(),
                        updatedAt: b.updatedAt.toISOString()
                    }))} />
                </CardContent>
            </Card>
        </div>
    );
}
