import { Locations } from "@/services/map/location";

const LONGDO_KEY = process.env.NEXT_PUBLIC_LONGDO_MAP_KEY;

export const fetchNearbyHospitals = async (
  lat: number,
  lon: number
): Promise<Locations[]> => {
  try {
    const response = await fetch(
      `https://search.longdo.com/mapsearch/json/search?keyword=โรงพยาบาล&limit=50&location=${lon},${lat}&span=20km&key=${LONGDO_KEY}`
    );

    if (!response.ok) {
      console.error("fetch failed");
      return [];
    }

    const data = await response.json();

    if (data && Array.isArray(data.data)) {
      return data.data
        .map((h: any) => ({
          address: h.name,
          lat: h.lat,
          lon: h.lon,
          distance: h.distance,
        }))
        .filter((h: any) => h.distance <= 20000)
        .sort((a: any, b: any) => a.distance - b.distance);
    }
    return [];

  } catch (error) {
    console.error("Error fetching hospitals:", error);
    return []; 
  }
};

export const getAddressFromCoords = async (lat: number, lon: number): Promise<string> => {
  try {
    // เรียกใช้ Longdo Map API Service สำหรับ Reverse Geocoding
    const response = await fetch(
      `https://api.longdo.com/map/services/address?lon=${lon}&lat=${lat}&key=${LONGDO_KEY}`
    );

    if (!response.ok) return "ไม่สามารถระบุที่อยู่ได้";

    const data = await response.json();

    // รวมส่วนประกอบของที่อยู่ (ถนน, แขวง, เขต, จังหวัด) เข้าด้วยกัน
    const addressParts = [
      data.road,
      data.district,
      data.amphoe,
      data.province
    ].filter(Boolean); // กรองเอาเฉพาะที่มีข้อมูล (ไม่เป็น null หรือว่าง)

    return addressParts.length > 0 
      ? addressParts.join(" ") 
      : "ไม่ทราบชื่อสถานที่";

  } catch (error) {
    console.error("Reverse Geocode Error:", error);
    return "เกิดข้อผิดพลาดในการดึงที่อยู่";
  }
};