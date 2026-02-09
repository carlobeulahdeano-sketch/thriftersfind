"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdminLog } from "@prisma/client";
import { getAdminLogs, GetAdminLogsResult } from "@/actions/admin-logs";

export default function AdminLogsTable() {
    const [logsData, setLogsData] = React.useState<GetAdminLogsResult>({
        logs: [],
        totalLogs: 0,
        totalPages: 1,
        currentPage: 1
    });
    const [loading, setLoading] = React.useState(true);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedLog, setSelectedLog] = React.useState<AdminLog | null>(null);
    const [isDetailsOpen, setDetailsOpen] = React.useState(false);

    const fetchLogs = async (page: number) => {
        setLoading(true);
        try {
            const result = await getAdminLogs(page, 10);
            setLogsData(result);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage]);

    const handleRefresh = () => {
        fetchLogs(currentPage);
    }

    const handleViewDetails = (log: AdminLog) => {
        setSelectedLog(log);
        setDetailsOpen(true);
    }

    const formatJSON = (data: any) => {
        if (!data) return "N/A";
        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return "Invalid JSON";
        }
    }

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "default";
        if (action.includes("UPDATE")) return "secondary";
        if (action.includes("DELETE")) return "destructive";
        return "outline";
    }

    return (
        <>
            <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>System Logs</CardTitle>
                            <CardDescription>View all system activities and changes.</CardDescription>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[180px] font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Action</TableHead>
                                <TableHead className="font-semibold">Module</TableHead>
                                <TableHead className="font-semibold">Performed By</TableHead>
                                <TableHead className="font-semibold">Description</TableHead>
                                <TableHead className="text-right font-semibold">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : logsData.logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logsData.logs.map((log) => (
                                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(log)}>
                                        <TableCell className="font-mono text-xs">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getActionColor(log.action) as any}>
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium text-sm">{log.module || "-"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {(log.performedBy as any)?.name || 'System'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate" title={log.description || ""}>
                                            {log.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">Details</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <div className="flex items-center justify-between gap-4 p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Page {logsData.currentPage} of {logsData.totalPages} ({logsData.totalLogs} logs)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(logsData.totalPages, p + 1))}
                            disabled={currentPage === logsData.totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Log Details</DialogTitle>
                        <DialogDescription>
                            {selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-1">Action</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Module</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.module || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Date</h4>
                                        <p className="text-sm text-muted-foreground">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">IP Address</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.ipAddress || "N/A"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-1">Description</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.description}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="font-medium mb-1">Performed By</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                            {formatJSON(selectedLog.performedBy)}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Target Type</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.targetType || "N/A"}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-1">Target ID</h4>
                                        <p className="text-sm text-muted-foreground">{selectedLog.targetId || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div>
                                        <h4 className="font-medium mb-2 text-yellow-600">Previous Data</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[300px]">
                                            {formatJSON(selectedLog.previousData)}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2 text-green-600">New Data</h4>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-[300px]">
                                            {formatJSON(selectedLog.newData)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
