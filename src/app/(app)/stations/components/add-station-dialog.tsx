
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createStation } from "../actions";

interface AddStationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddStationDialog({ isOpen, onClose, onSuccess }: AddStationDialogProps) {
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState<"courier" | "pickup">("courier");
    const [contactNumber, setContactNumber] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    const resetForm = () => {
        setName("");
        setLocation("");
        setType("courier");
        setContactNumber("");
        setLatitude("");
        setLongitude("");
        setIsActive(true);
    };

    const handleGeocode = async () => {
        if (!location) {
            toast({
                variant: "destructive",
                title: "Location Required",
                description: "Please enter a location first.",
            });
            return;
        }

        setIsGeocoding(true);
        try {
            // Use OpenStreetMap Nominatim API (Free)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
            );
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                setLatitude(result.lat);
                setLongitude(result.lon);
                toast({
                    title: "Coordinates Found",
                    description: `Found location: ${result.display_name}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "No Results",
                    description: "Could not find coordinates for this location. Please try a more specific address.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch coordinates. Please try again.",
            });
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleSave = async () => {
        if (!name || !location) {
            toast({
                variant: "destructive",
                title: "Missing Information",
                description: "Please fill out all required fields (Name and Location).",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createStation({
                name,
                location,
                type,
                contactNumber: contactNumber || undefined,
                latitude: latitude ? parseFloat(latitude) : undefined,
                longitude: longitude ? parseFloat(longitude) : undefined,
                isActive,
            });

            if (result.success) {
                toast({
                    title: "Station Created",
                    description: `Station "${name}" has been created successfully.`,
                });
                resetForm();
                onClose();
                onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to create station.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                {/* Gradient Header */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg flex items-center px-6">
                    <div className="flex items-center gap-3 text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                            <DialogTitle className="text-white text-lg font-semibold">Add New Station</DialogTitle>
                            <DialogDescription className="text-blue-100 text-sm">
                                Create a new courier or pickup station
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                {/* Content with top padding for header */}
                <div className="pt-12 max-h-[75vh] overflow-y-auto pr-2">
                    {/* Station Information Section */}
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-6 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-semibold text-sm">Station Information</h3>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Station Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Montevista Courier Station"
                                    className="bg-white dark:bg-gray-950"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Type
                                    </Label>
                                    <Select value={type} onValueChange={(value: "courier" | "pickup") => setType(value)}>
                                        <SelectTrigger className="bg-white dark:bg-gray-950">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="courier">Courier</SelectItem>
                                            <SelectItem value="pickup">Pickup</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contactNumber" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Contact Number
                                    </Label>
                                    <Input
                                        id="contactNumber"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        placeholder="e.g. +63 912 345 6789"
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Details Section */}
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-6 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h3 className="font-semibold text-sm">Location Details</h3>
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="location" className="flex items-center gap-2 text-sm">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Location <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="e.g. Montevista, Davao de Oro"
                                        className="flex-1 bg-white dark:bg-gray-950"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleGeocode}
                                        disabled={isGeocoding || !location}
                                        title="Get Coordinates from Location"
                                    >
                                        {isGeocoding ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        ) : (
                                            <span className="text-lg">📍</span>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Click the pin to auto-fill latitude and longitude.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="latitude" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Latitude
                                    </Label>
                                    <Input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        placeholder="e.g. 7.6667"
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="longitude" className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Longitude
                                    </Label>
                                    <Input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        placeholder="e.g. 126.0833"
                                        className="bg-white dark:bg-gray-950"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-6 mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-semibold text-sm">Status</h3>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="isActive" className="flex items-center gap-2 text-sm">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Active Status
                            </Label>
                            <Switch
                                id="isActive"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <DialogFooter className="gap-2 sticky bottom-0 bg-background pt-4 pb-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSubmitting}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                            {isSubmitting ? "Creating..." : "Create Station"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
