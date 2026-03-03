
"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Station } from "../actions";

interface StationsMapProps {
    stations: Station[];
}

export function StationsMap({ stations }: StationsMapProps) {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<any>(null);
    const [mapLoaded, setMapLoaded] = React.useState(false);

    // Filter stations that have coordinates
    const stationsWithCoords = stations.filter(
        (station) => station.latitude != null && station.longitude != null && station.isActive
    );

    React.useEffect(() => {
        // Load Leaflet CSS and JS
        const loadLeaflet = async () => {
            // Check if already loaded
            if (typeof window !== "undefined" && (window as any).L) {
                initializeMap();
                return;
            }

            // Load Leaflet CSS
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);

            // Load Leaflet JS
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => {
                setMapLoaded(true);
                initializeMap();
            };
            document.head.appendChild(script);
        };

        const initializeMap = () => {
            if (!mapRef.current || stationsWithCoords.length === 0) return;
            if (!(window as any).L) return;

            const L = (window as any).L;

            // Cleanup existing map instance if it exists
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            // Center on first station or default
            const center = stationsWithCoords[0]
                ? [stationsWithCoords[0].latitude!, stationsWithCoords[0].longitude!]
                : [7.6667, 126.0833];

            // Create map and store instance
            const map = L.map(mapRef.current).setView(center, 11);
            mapInstanceRef.current = map;

            // Add OpenStreetMap tiles (free, no API key needed!)
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Add markers for each station
            stationsWithCoords.forEach((station) => {
                const markerColor = station.type === "courier" ? "#3b82f6" : "#8b5cf6";

                // Create custom icon
                const icon = L.divIcon({
                    className: "custom-marker",
                    html: `
            <div style="
              background-color: ${markerColor};
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
              <div style="
                transform: rotate(45deg);
                margin-top: 6px;
                margin-left: 8px;
                color: white;
                font-size: 14px;
              ">📍</div>
            </div>
          `,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                });

                const marker = L.marker([station.latitude!, station.longitude!], { icon }).addTo(map);

                // Add popup
                const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">${station.name}</h3>
            <p style="margin: 4px 0; font-size: 12px; color: #666;">${station.location}</p>
            <p style="margin: 4px 0; font-size: 12px;">
              <span style="display: inline-block; padding: 2px 8px; background: ${station.type === "courier" ? "#dbeafe" : "#ede9fe"
                    }; border-radius: 4px; font-weight: 500;">
                ${station.type.charAt(0).toUpperCase() + station.type.slice(1)}
              </span>
            </p>
            ${station.contactNumber ? `<p style="margin: 4px 0; font-size: 12px;">📞 ${station.contactNumber}</p>` : ""}
          </div>
        `;

                marker.bindPopup(popupContent);
            });

            // Fit bounds if multiple stations
            if (stationsWithCoords.length > 1) {
                const bounds = L.latLngBounds(
                    stationsWithCoords.map((s) => [s.latitude!, s.longitude!])
                );
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        };

        loadLeaflet();

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(stationsWithCoords)]);

    if (stationsWithCoords.length === 0) {
        return (
            <Card className="p-8">
                <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold text-lg mb-2">No Stations to Display</h3>
                    <p className="mb-4">Add latitude and longitude coordinates to stations to see them on the map.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="overflow-hidden">
            <div ref={mapRef} className="w-full h-[600px]" />
            <div className="p-4 border-t bg-muted/50">
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Courier Station</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span>Pickup Station</span>
                    </div>
                    <div className="ml-auto text-muted-foreground">
                        {stationsWithCoords.length} station{stationsWithCoords.length !== 1 ? "s" : ""} on map
                    </div>
                </div>
            </div>
        </Card>
    );
}
