
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, Search, X, MapPin, List, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AddStationDialog } from "./add-station-dialog";
import { EditStationDialog } from "./edit-station-dialog";
import { ViewStationDialog } from "./view-station-dialog";
import { StationsMap } from "./stations-map";
import type { Station } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { deleteStation } from "../actions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function StationsTable({ stations: initialStations }: { stations: Station[] }) {
    const { toast } = useToast();
    const router = useRouter();
    const [stations, setStations] = React.useState<Station[]>(initialStations);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [typeFilter, setTypeFilter] = React.useState<string>("all");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [viewMode, setViewMode] = React.useState<"list" | "map">("list");
    const itemsPerPage = 10;
    const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
    const [editingStation, setEditingStation] = React.useState<Station | null>(null);
    const [viewingStation, setViewingStation] = React.useState<Station | null>(null);

    const refreshStations = () => {
        router.refresh();
    };

    React.useEffect(() => {
        let filtered = initialStations;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (station) =>
                    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    station.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter((station) => station.type === typeFilter);
        }

        setStations(filtered);
        setCurrentPage(1);
    }, [searchTerm, typeFilter, initialStations]);

    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async (stationId: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteStation(stationId);

            if (!result.success) {
                throw new Error(result.error || "Failed to delete station");
            }

            toast({
                title: "Station Deleted",
                description: "The station has been removed successfully.",
            });

            refreshStations();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete station. Please try again.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const paginatedStations = stations.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(stations.length / itemsPerPage);

    const isFiltered = searchTerm !== "" || typeFilter !== "all";

    const resetFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
    };

    return (
        <>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "map")} className="w-full">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <TabsList>
                        <TabsTrigger value="list" className="gap-2">
                            <List className="h-4 w-4" />
                            List View
                        </TabsTrigger>
                        <TabsTrigger value="map" className="gap-2">
                            <Map className="h-4 w-4" />
                            Map View
                        </TabsTrigger>
                    </TabsList>
                    <Button onClick={() => setAddDialogOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Station
                    </Button>
                </div>

                <TabsContent value="list" className="mt-0">
                    <Card className="border-t-4 border-t-pink-500/50 shadow-sm">
                        <div className="flex items-center justify-between gap-2 p-4 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by name or location..."
                                        className="pl-8 sm:w-[250px]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="courier">Courier</SelectItem>
                                        <SelectItem value="pickup">Pickup</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isFiltered && (
                                    <Button variant="ghost" onClick={resetFilters}>
                                        Reset
                                        <X className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="font-semibold">Name</TableHead>
                                        <TableHead className="font-semibold">Location</TableHead>
                                        <TableHead className="font-semibold">Type</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead className="text-center font-semibold">Status</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedStations.map((station) => (
                                        <TableRow key={station.id} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-pink-500" />
                                                    {station.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{station.location}</TableCell>
                                            <TableCell>
                                                <Badge variant={station.type === "courier" ? "default" : "secondary"}>
                                                    {station.type.charAt(0).toUpperCase() + station.type.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{station.contactNumber || "—"}</TableCell>
                                            <TableCell className="text-center">
                                                {station.isActive ? (
                                                    <Badge variant="secondary">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Toggle menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setViewingStation(station)}>
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => setEditingStation(station)}>
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the station
                                                                from the system.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDelete(station.id)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                                disabled={isDeleting}
                                                            >
                                                                {isDeleting ? "Deleting..." : "Delete"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {paginatedStations.length === 0 && (
                                <div className="text-center p-8 text-muted-foreground">
                                    No stations found.
                                </div>
                            )}
                        </CardContent>
                        <div className="flex items-center justify-between gap-4 p-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages || 1}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="map" className="mt-0">
                    <StationsMap stations={stations} />
                </TabsContent>
            </Tabs>

            <AddStationDialog
                isOpen={isAddDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onSuccess={refreshStations}
            />
            <EditStationDialog
                isOpen={!!editingStation}
                onClose={() => setEditingStation(null)}
                station={editingStation}
                onSuccess={refreshStations}
            />
            <ViewStationDialog
                isOpen={!!viewingStation}
                onClose={() => setViewingStation(null)}
                station={viewingStation}
            />
        </>
    );
}
