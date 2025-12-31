import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { LocationCode } from "@/lib/api/types";

interface LocationSelectorProps {
  value?: number;
  onChange: (locationCode: number) => void;
  label?: string;
  placeholder?: string;
  showSearch?: boolean;
  className?: string;
  disabled?: boolean;
}

// Default location code for United States
const DEFAULT_LOCATION_CODE = 2840;

export function LocationSelector({
  value,
  onChange,
  label = "Location",
  placeholder = "Select a location...",
  showSearch = true,
  className = "",
  disabled = false,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<LocationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use general location codes API with countries_only filter
        // Request all locations by setting per_page to 500 (max allowed, we have 212 total)
        const response = await apiClient.getLocationCodes({
          countries_only: true,
          sort_by: "location_name",
          sort_order: "asc",
          per_page: 500, // Request all locations at once (max 500, we have 212 total)
        });
        // The API client's get() method returns data.response, which is the inner response object
        // The actual API response structure is: { location_codes: LocationCode[], pagination: {...} }
        const locationsData = (response as any)?.location_codes || [];
        setLocations(locationsData);
      } catch (err: any) {
        console.error("Failed to load locations:", err);
        setError("Failed to load locations");
        setLocations([]); // Ensure locations is empty on error
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations;
    const lowerQuery = searchQuery.toLowerCase();
    return locations.filter(
      (loc) =>
        loc.location_name.toLowerCase().includes(lowerQuery) ||
        loc.country_iso_code?.toLowerCase().includes(lowerQuery)
    );
  }, [locations, searchQuery]);

  const selectedLocation = locations.find((loc) => loc.location_code === value);

  // Set default value if no value is provided
  useEffect(() => {
    if (!value && locations.length > 0) {
      const defaultLocation = locations.find((loc) => loc.location_code === DEFAULT_LOCATION_CODE);
      if (defaultLocation) {
        onChange(DEFAULT_LOCATION_CODE);
      } else if (locations.length > 0) {
        // Fallback to first location if US not found
        onChange(locations[0].location_code);
      }
    }
  }, [locations, value, onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <Select
        value={value?.toString() || (locations.length > 0 ? DEFAULT_LOCATION_CODE.toString() : "")}
        onValueChange={(val) => onChange(Number(val))}
        disabled={loading || disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading locations..." : placeholder}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : selectedLocation ? (
              `${selectedLocation.location_name}${selectedLocation.country_iso_code ? ` (${selectedLocation.country_iso_code})` : ""}`
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading locations...
              </span>
            </SelectItem>
          ) : error ? (
            <SelectItem value="error" disabled>
              Failed to load locations
            </SelectItem>
          ) : locations.length === 0 ? (
            <SelectItem value="no-results" disabled>
              No locations found
            </SelectItem>
          ) : (
            <>
              {showSearch && (
                <div className="px-2 py-1.5">
                  <Input
                    type="text"
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              {filteredLocations.length === 0 && searchQuery ? (
                <SelectItem value="no-match" disabled>
                  No locations match "{searchQuery}"
                </SelectItem>
              ) : (
                filteredLocations.map((location) => (
                  <SelectItem key={location.location_code} value={location.location_code.toString()}>
                    {location.location_name}
                    {location.country_iso_code && ` (${location.country_iso_code})`}
                  </SelectItem>
                ))
              )}
            </>
          )}
        </SelectContent>
      </Select>

      {selectedLocation && !loading && (
        <p className="text-xs text-muted-foreground">
          Location Code: {selectedLocation.location_code}
        </p>
      )}
    </div>
  );
}

