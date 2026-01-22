"use client";
import { useEffect, useState } from "react";
import { getDistanceMeters } from "@/utils/distance";
import type { GeoPoint } from "@/types/map/geo";
import type { LongdoSearchItem, LongdoSearchResponse, SelectedLocation } from "@/types/map/search";
interface PlaceSearchProps {
  label: string;
  onSelect: (loc: SelectedLocation) => void;
  value?: string;
  nearby?: GeoPoint;
  isHospitalSearch?: boolean;
}

export default function PlaceSearch({
  label,
  onSelect,
  value = "",
  nearby,
  isHospitalSearch = false,
}: PlaceSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LongdoSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isManualTyping, setIsManualTyping] = useState(false);

  useEffect(() => {
    setIsManualTyping(false);
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isManualTyping && query.trim().length >= 2) performSearch(query.trim());
      else setResults([]);
    }, 500);
    return () => clearTimeout(timer);
  }, [query, isManualTyping]);

  const performSearch = async (text: string) => {
    setIsSearching(true);
    try {
      let url = `https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(text)}&limit=30&key=${process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}`;

      if (isHospitalSearch) url += `&tag=hospital`;
      if (nearby?.lat && nearby?.lon) url += `&location=${nearby.lon},${nearby.lat}&span=20km`;

      const res = await fetch(url);
      const data = (await res.json()) as LongdoSearchResponse;

      if (!data?.data) {
        setResults([]);
        return;
      }

      //คำนวณระยะทางใหม่จาก "จุดรับ" จริงๆ เพื่อความแม่นยำ
      let finalResults: LongdoSearchItem[] = data.data.map((item) => {
        const distance = nearby
          ? getDistanceMeters(nearby.lat, nearby.lon, item.lat, item.lon)
          : item.distance;

        return { ...item, distance };
      });

      //กรองและเรียงลำดับ (กรณีโรงพยาบาล)
      if (isHospitalSearch) {
        finalResults = finalResults
          .filter((item) => item.distance !== undefined && item.distance <= 20000)
          .sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      setResults(finalResults);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full">
      <label className="block text-sm font-bold mb-1 text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}

          onChange={(e) => {
            setIsManualTyping(true);
            setQuery(e.target.value)
          }}
          placeholder={isHospitalSearch ? "พิมพ์ชื่อโรงพยาบาล..." : "ค้นหาสถานที่..."}
          className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#70C5BE] outline-none pr-5 text-xs"
        />
        {isSearching && (
          <div className="absolute right-3 top-3.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute z-100 w-full bg-white border mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((item, index) => (
            <li
              key={index}
              onClick={() => {
                onSelect({ address: item.name, lat: item.lat, lon: item.lon, distance: item.distance });
                setQuery(item.name);
                setResults([]);
              }}
              className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-none text-sm group"
            >
              <div className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{item.name}</div>
              <div className="text-[10px] text-gray-400">
                {item.address}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}