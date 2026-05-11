import { useMemo, useState } from 'react';
import type { CRSItem } from '../types';
import { parseCrsLatLong, distSq, isItemInRegion } from '../utils/geoUtils';

interface UseCRSFilterProps {
  data: CRSItem[];
  searchQuery: string;
  location?: { lat: number; lng: number } | null;
  serverLocation?: string;
  filterByLocation: boolean;
  unitFilter?: string;
  customFilter?: (item: CRSItem) => boolean;
  minResults?: number; // Minimum number of results to show when filtering by location
}

export const useCRSFilter = ({
  data,
  searchQuery,
  location,
  serverLocation = "Europe",
  filterByLocation,
  unitFilter = "All",
  customFilter,
  minResults = 3
}: UseCRSFilterProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof CRSItem; direction: 'asc' | 'desc' } | null>(null);

  const hasLocation = !!location;

  const filteredAndSortedItems = useMemo(() => {
    let filtered = data;
    let searchScores: Map<string, number> | null = null;

    // 1. Custom Filter (Type or Mode specific)
    if (customFilter) {
        filtered = filtered.filter(customFilter);
    }

    // 2. Unit Filter
    if (unitFilter !== "All") {
        filtered = filtered.filter(item => item.unit === unitFilter);
    }

    // 3. Location Filter with minimum results guarantee
    if (filterByLocation && hasLocation && location) {
         // Calculate distances for all items
         const itemsWithDistance = filtered.map(item => {
             const crsLoc = parseCrsLatLong(item.latLong);
             const distance = crsLoc 
                 ? distSq(location.lat, location.lng, crsLoc.lat, crsLoc.lng)
                 : Infinity;
             const inRegion = isItemInRegion(item, serverLocation);
             return { item, distance, inRegion, hasLocation: !!crsLoc };
         });

         // Sort by distance (items without location go to the end)
         itemsWithDistance.sort((a, b) => {
             if (!a.hasLocation && !b.hasLocation) return 0;
             if (!a.hasLocation) return 1;
             if (!b.hasLocation) return -1;
             return a.distance - b.distance;
         });

         // Apply strict distance filter first (< 25 degrees squared)
         let strictFiltered = itemsWithDistance.filter(({ distance, inRegion }) => 
             distance < 25 || inRegion
         );

         // If we have fewer than minResults, expand to include closest items
         if (strictFiltered.length < minResults) {
             // Take the closest minResults items regardless of distance
             strictFiltered = itemsWithDistance.slice(0, Math.min(minResults, itemsWithDistance.length));
         }

         filtered = strictFiltered.map(({ item }) => item);
    }

    // 4. Search Filter + relevance scoring
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.trim().toLowerCase();
      searchScores = new Map<string, number>();

      const getScore = (item: CRSItem): number => {
        const name = item.name.toLowerCase();
        const code = item.code.toLowerCase();
        const area = item.area.toLowerCase();

        if (code === q || name === q) return 100;
        if (code.startsWith(q)) return 90;
        if (name.startsWith(q)) return 80;
        if (code.includes(q)) return 60;
        if (name.includes(q)) return 50;
        if (area.includes(q)) return 30;
        return 0;
      };

      filtered = filtered.filter(item => {
        const score = getScore(item);
        if (score > 0) {
          searchScores?.set(item.code, score);
          return true;
        }
        return false;
      });
    }

    // 5. Sorting
    if (sortConfig) {
        filtered.sort((a, b) => {
            const aVal = String(a[sortConfig.key] || '').toLowerCase();
            const bVal = String(b[sortConfig.key] || '').toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    } else if (searchScores) {
         // Default to relevance sorting when searching and no explicit sort is selected.
         filtered.sort((a, b) => {
            const scoreA = searchScores?.get(a.code) ?? 0;
            const scoreB = searchScores?.get(b.code) ?? 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.name.localeCompare(b.name);
         });
    } else if (filterByLocation && hasLocation && location) {
         // Default sort by distance if location filter active (already sorted in step 3)
         filtered.sort((a, b) => {
            const locA = parseCrsLatLong(a.latLong);
            const locB = parseCrsLatLong(b.latLong);
            
            // Push items without location to the bottom
            if (!locA && !locB) return 0;
            if (!locA) return 1;
            if (!locB) return -1;

            const distA = distSq(location.lat, location.lng, locA.lat, locA.lng);
            const distB = distSq(location.lat, location.lng, locB.lat, locB.lng);
            return distA - distB;
         });
    }

    return filtered;
  }, [data, searchQuery, location, hasLocation, serverLocation, filterByLocation, unitFilter, customFilter, sortConfig, minResults]);

  const handleSort = (key: keyof CRSItem) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return {
    filteredAndSortedItems,
    sortConfig,
    handleSort
  };
};
