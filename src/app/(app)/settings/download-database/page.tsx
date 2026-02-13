"use client";

import * as React from "react";
import { Download, Database, FileText, AlertCircle, CheckCircle2, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { getDatabaseOperations, exportDatabase } from "../actions";

export default function DownloadDatabasePage() {
    const [exportFormat, setExportFormat] = React.useState("sql");
    const [selectedTables, setSelectedTables] = React.useState<string[]>([
        "orders",
        "customers",
        "products",
    ]);
    // ... (rest of state)

    // ...

    <Select value={exportFormat} onValueChange={setExportFormat}>
        <SelectTrigger id="format">
            <SelectValue />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="sql">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>SQL Database (.sql)</span>
                </div>
            </SelectItem>
            <SelectItem value="json">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>JSON Format (.json)</span>
                </div>
            </SelectItem>
            {/* CSV temporarily disabled until implemented */}
        </SelectContent>
    </Select>
    const [includeSchema, setIncludeSchema] = React.useState(true);
    const [compressFile, setCompressFile] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const [recentExports, setRecentExports] = React.useState<any[]>([]);

    // Available database tables
    const availableTables = [
        { id: "orders", name: "Orders", records: "Dynamic" },
        { id: "customers", name: "Customers", records: "Dynamic" },
        { id: "products", name: "Products", records: "Dynamic" },
        { id: "batches", name: "Batches", records: "Dynamic" },
        { id: "users", name: "Users", records: "Dynamic" },
        { id: "stations", name: "Stations", records: "Dynamic" },
        { id: "notifications", name: "Notifications", records: "Dynamic" },
        { id: "messages", name: "Messages", records: "Dynamic" },
        { id: "branches", name: "Branches", records: "Dynamic" },
        { id: "roles", name: "Roles", records: "Dynamic" },
        { id: "archive_data", name: "Archive Data", records: "Dynamic" },
        { id: "warehouse_products", name: "Warehouse Products", records: "Dynamic" },
        { id: "database_operations", name: "Database Operations", records: "Dynamic" },
        { id: "sales_logs", name: "Sales Logs", records: "Dynamic" },
        { id: "admin_logs", name: "Admin Logs", records: "Dynamic" },
        { id: "pre_orders", name: "Pre-Orders", records: "Dynamic" },
        { id: "pre_order_items", name: "Pre-Order Items", records: "Dynamic" },
        { id: "inventory_logs", name: "Inventory Logs", records: "Dynamic" },
    ];

    React.useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const result = await getDatabaseOperations();
        if (result.success && result.data) {
            // Filter for exports
            const exports = result.data.filter((op: any) => op.type === 'EXPORT');
            setRecentExports(exports);
        }
    };

    const handleTableToggle = (tableId: string) => {
        setSelectedTables((prev) =>
            prev.includes(tableId)
                ? prev.filter((id) => id !== tableId)
                : [...prev, tableId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTables.length === availableTables.length) {
            setSelectedTables([]);
        } else {
            setSelectedTables(availableTables.map((t) => t.id));
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await exportDatabase({
                format: exportFormat,
                tables: selectedTables,
                includeSchema,
                compress: compressFile
            });

            if (result.success && result.data) {
                // Create blob and download
                const mimeType = exportFormat === 'json' ? 'application/json' : 'application/sql';
                const blob = new Blob([result.data], { type: mimeType });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                // Reload history
                loadHistory();
            } else {
                alert("Export failed: " + (result.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred during export");
        } finally {
            setIsExporting(false);
        }
    };

    const formatFileSize = (bytes: any) => {
        return bytes; // Currently stored as string in DB
    };

    // The getTotalRecords function is no longer used in the updated UI, so it can be removed.
    // const getTotalRecords = () => {
    //     return availableTables
    //         .filter((table) => selectedTables.includes(table.id))
    //         .reduce((sum, table) => sum + table.records, 0);
    // };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Download Database</h2>
                    <p className="text-muted-foreground mt-2">
                        Export and download your database backup in various formats
                    </p>
                </div>
                <Download className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Export Configuration */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Export Format & Options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Export Settings
                        </CardTitle>
                        <CardDescription>
                            Configure your database export preferences
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Format Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="format" className="text-base font-semibold">
                                Export Format
                            </Label>
                            <Select value={exportFormat} onValueChange={setExportFormat}>
                                <SelectTrigger id="format">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sql">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4" />
                                            <span>SQL Database (.sql)</span>
                                        </div>
                                    </SelectItem>
                                    {/* JSON and CSV disabled as per user request */}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Export your database in SQL format
                            </p>
                        </div>

                        {/* Export Options */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Export Options</Label>

                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="schema" className="font-medium cursor-pointer">
                                        Include Database Schema
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Export table structures along with data
                                    </p>
                                </div>
                                <Switch
                                    id="schema"
                                    checked={includeSchema}
                                    onCheckedChange={setIncludeSchema}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="compress" className="font-medium cursor-pointer">
                                        Compress File (ZIP)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Reduce file size with compression
                                    </p>
                                </div>
                                <Switch
                                    id="compress"
                                    checked={compressFile}
                                    onCheckedChange={setCompressFile}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleExport}
                            disabled={selectedTables.length === 0 || isExporting}
                            className="w-full"
                            size="lg"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {isExporting ? "Preparing Export..." : "Export & Download"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Table Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Select Tables
                        </CardTitle>
                        <CardDescription>
                            Choose which tables to include in the export
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b">
                            <Label className="text-base font-semibold">Available Tables</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                            >
                                {selectedTables.length === availableTables.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {availableTables.map((table) => (
                                <div
                                    key={table.id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id={table.id}
                                            checked={selectedTables.includes(table.id)}
                                            onCheckedChange={() => handleTableToggle(table.id)}
                                        />
                                        <div>
                                            <Label
                                                htmlFor={table.id}
                                                className="font-medium cursor-pointer"
                                            >
                                                {table.name}
                                            </Label>
                                        </div>
                                    </div>
                                    {selectedTables.includes(table.id) && (
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Exports History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Exports
                    </CardTitle>
                    <CardDescription>
                        Download your previously exported database files
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Export Date</TableHead>
                                <TableHead>Format</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentExports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                        No recent exports found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentExports.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {item.fileName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{item.fileSize}</TableCell>
                                        <TableCell className="text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{(item.details as any)?.format || 'JSON'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.status === "SUCCESS" ? (
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Success
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    Failed
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
