"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface Station {
    id: string;
    name: string;
    location: string;
    type: string;
    contactNumber?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export async function getStations(): Promise<Station[]> {
    try {
        const stations = await prisma.station.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return stations.map(station => ({
            id: station.id,
            name: station.name,
            location: station.location,
            type: station.type,
            contactNumber: station.contactNumber,
            latitude: station.latitude,
            longitude: station.longitude,
            isActive: station.isActive,
            createdAt: station.createdAt,
            updatedAt: station.updatedAt,
        }));
    } catch (error) {
        console.error("Error fetching stations:", error);
        return [];
    }
}

export async function createStation(data: {
    name: string;
    location: string;
    type: string;
    contactNumber?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    isActive?: boolean;
}): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate required fields
        if (!data.name || !data.location || !data.type) {
            return { success: false, error: "Name, location, and type are required" };
        }

        // Validate type
        if (!['courier', 'pickup'].includes(data.type)) {
            return { success: false, error: "Type must be either 'courier' or 'pickup'" };
        }

        await prisma.station.create({
            data: {
                name: data.name,
                location: data.location,
                type: data.type,
                contactNumber: data.contactNumber,
                latitude: data.latitude,
                longitude: data.longitude,
                isActive: data.isActive !== undefined ? data.isActive : true,
            },
        });

        revalidatePath("/stations");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating station:", error);
        return { success: false, error: error.message || "Failed to create station" };
    }
}

export async function updateStation(
    id: string,
    data: {
        name?: string;
        location?: string;
        type?: string;
        contactNumber?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        isActive?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate type if provided
        if (data.type && !['courier', 'pickup'].includes(data.type)) {
            return { success: false, error: "Type must be either 'courier' or 'pickup'" };
        }

        await prisma.station.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.type !== undefined && { type: data.type }),
                ...(data.contactNumber !== undefined && { contactNumber: data.contactNumber }),
                ...(data.latitude !== undefined && { latitude: data.latitude }),
                ...(data.longitude !== undefined && { longitude: data.longitude }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        revalidatePath("/stations");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating station:", error);
        return { success: false, error: error.message || "Failed to update station" };
    }
}

export async function deleteStation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!id) {
            return { success: false, error: "Station ID is required" };
        }

        // Use deleteMany to avoid throwing P2025 error if the record is already deleted
        const result = await prisma.station.deleteMany({
            where: { id },
        });

        if (result.count === 0) {
            return { success: false, error: "Station not found or already deleted" };
        }

        revalidatePath("/stations");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting station:", error);

        // Handle common Prisma error for foreign key constraints
        if (error.code === 'P2003') {
            return {
                success: false,
                error: "Cannot delete station because it is being used by other records (e.g., orders or logs)."
            };
        }

        return { success: false, error: error.message || "Failed to delete station" };
    }
}
